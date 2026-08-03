using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.DTOs;
using PadelBooking.API.Models;
using PadelBooking.API.Services;

namespace PadelBooking.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BookingController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BookingController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Booking
    [HttpGet]
    public async Task<IActionResult> GetBookings(
        int? courtId,
        string? phone,
        DateTime? date,
        BookingStatus? status,
        PaymentMethod? paymentMethod)
    {
        var query = _context.Bookings.AsQueryable();

        if (courtId.HasValue)
            query = query.Where(b => b.CourtId == courtId);

        if (!string.IsNullOrEmpty(phone))
            query = query.Where(b => b.Phone.Contains(phone));

        if (date.HasValue)
            query = query.Where(b => b.BookingDate.Date == date.Value.Date);

        if (status.HasValue)
            query = query.Where(b => b.Status == status);

        if (paymentMethod.HasValue)
            query = query.Where(b => b.PaymentMethod == paymentMethod);

        var bookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BookingListDto
            {
                Id = b.Id,
                Phone = b.Phone,
                CustomerName = b.CustomerName,
                CustomerEmail = b.CustomerEmail,
                CourtId = b.CourtId,
                Court = b.Court == null
                    ? null
                    : new CourtSummaryDto { Id = b.Court.Id, Name = b.Court.Name },
                BookingDate = b.BookingDate,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                TotalHours = b.TotalHours,
                TotalPrice = b.TotalPrice,
                Status = b.Status,
                PaymentMethod = b.PaymentMethod,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(bookings);
    }

    // GET: api/Booking/available?date=2026-09-10&hours=2
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableTimes(DateTime date, [FromQuery] int hours = 1)
    {
        if (date.Date < DateTime.Now.Date)
            return BadRequest("لا يمكن الحجز في تاريخ سابق");

        if (hours < 1) hours = 1;
        if (hours > 6) hours = 6;

        var courts = await _context.Courts.Where(c => c.IsActive).ToListAsync();
        var workingHours = await _context.CourtWorkingHours.ToListAsync();
        var closures = await _context.CourtClosures.ToListAsync();
        var bookings = await _context.Bookings.ToListAsync();

        if (courts.Count == 0)
            return Ok(Array.Empty<object>());

        var minHour = BookingHelper.GetMinHour(courts, date.DayOfWeek, workingHours);
        var maxHour = BookingHelper.GetMaxHour(courts, date.DayOfWeek, workingHours);

        if (minHour >= maxHour)
        {
            minHour = courts.Where(c => c.IsActive).Min(c => c.OpeningTime.Hours);
            maxHour = courts.Where(c => c.IsActive).Max(c => c.ClosingTime.Hours);
        }

        var result = new List<object>();

        for (int hour = minHour; hour < maxHour; hour++)
        {
            var start = new TimeSpan(hour, 0, 0);
            var end = new TimeSpan(hour + hours, 0, 0);
            var displayEnd = new TimeSpan(hour + 1, 0, 0);

            if (date.Date == DateTime.Now.Date && start <= DateTime.Now.TimeOfDay)
            {
                result.Add(new { startTime = start, endTime = displayEnd, available = false });
                continue;
            }

            if (hour + hours > maxHour)
            {
                result.Add(new { startTime = start, endTime = displayEnd, available = false });
                continue;
            }

            // الوقت يظهر فقط إن وُجد ملعب واحد يغطي كامل المدة
            bool available = courts.Any(c =>
                BookingHelper.IsCourtAvailableForSlot(
                    c, date, start, end, workingHours, closures, bookings));

            result.Add(new { startTime = start, endTime = displayEnd, available });
        }

        return Ok(result);
    }

    // POST: api/Booking
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest("رقم الهاتف مطلوب");

        var endDate = request.EndDate?.Date ?? request.BookingDate.Date;
        if (endDate < request.BookingDate.Date)
            return BadRequest("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");

        var courts = await _context.Courts.Where(c => c.IsActive).ToListAsync();
        if (courts.Count == 0)
            return BadRequest("لا توجد ملاعب متاحة");

        var workingHours = await _context.CourtWorkingHours.ToListAsync();
        var closures = await _context.CourtClosures.ToListAsync();
        var bookings = await _context.Bookings.ToListAsync();
        var offers = await _context.Offers.ToListAsync();

        var totalHours = (int)(request.EndTime - request.StartTime).TotalHours;
        if (totalHours <= 0)
            return BadRequest("وقت الحجز غير صحيح");

        var savedBookings = new List<Booking>();
        decimal totalPrice = 0;

        for (var day = request.BookingDate.Date; day <= endDate; day = day.AddDays(1))
        {
            if (day < DateTime.Now.Date)
                return BadRequest("لا يمكن الحجز في تاريخ سابق");

            if (day == DateTime.Now.Date && request.StartTime <= DateTime.Now.TimeOfDay)
                return BadRequest("لا يمكن حجز وقت مضى");

            var selectedCourt = BookingHelper.PickRandomAvailableCourt(
                day, request.StartTime, request.EndTime,
                courts, workingHours, closures, bookings);

            if (selectedCourt == null)
                return BadRequest("الوقت غير متاح — جميع الملاعب محجوزة في هذا التوقيت");

            var price = BookingHelper.CalculatePrice(
                selectedCourt, totalHours, day, offers);

            var booking = new Booking
            {
                Phone = request.Phone.Trim(),
                CustomerName = request.CustomerName,
                CustomerEmail = request.CustomerEmail,
                CourtId = selectedCourt.Id,
                BookingDate = day,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                TotalHours = totalHours,
                TotalPrice = price,
                PaymentMethod = request.PaymentMethod,
                Status = BookingStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            savedBookings.Add(booking);
            bookings = bookings.Append(booking).ToList();
            totalPrice += price;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "تم إنشاء الحجز بنجاح",
            bookingId = savedBookings.First().Id,
            bookingIds = savedBookings.Select(b => b.Id).ToList(),
            bookingDate = request.BookingDate,
            endDate,
            startTime = request.StartTime,
            endTime = request.EndTime,
            totalHours,
            totalPrice,
            daysCount = savedBookings.Count,
            status = BookingStatus.Pending
        });
    }

    // PUT: api/Booking/1/cancel
    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelBooking(int id)
    {
        var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == id);
        if (booking == null)
            return NotFound("الحجز غير موجود");

        booking.Status = BookingStatus.Cancelled;
        await _context.SaveChangesAsync();
        return Ok("تم إلغاء الحجز");
    }
}
