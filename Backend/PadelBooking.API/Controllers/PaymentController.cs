using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.Models;
using PadelBooking.API.Services;

namespace PadelBooking.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ThawaniService _thawani;

    public PaymentController(ApplicationDbContext context, ThawaniService thawani)
    {
        _context = context;
        _thawani = thawani;
    }

    // GET ALL PAYMENTS
    [HttpGet]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await _context.Payments
            .Include(p => p.Booking)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(payments);
    }

    // POST api/Payment
    [HttpPost]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request)
    {
        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId);

        if (booking == null)
            return BadRequest("الحجز غير موجود");

        booking.PaymentMethod = request.PaymentMethod;

        var payment = new Payment
        {
            BookingId = request.BookingId,
            PaymentMethod = request.PaymentMethod,
            Amount = request.Amount ?? booking.TotalPrice,
            CreatedAt = DateTime.UtcNow
        };

        if (payment.PaymentMethod == PaymentMethod.PayAtVenue)
        {
            payment.Status = PaymentStatus.Pending;
            _context.Payments.Add(payment);

            var idsToConfirm = request.BookingIds?.Count > 0
                ? request.BookingIds
                : new List<int> { request.BookingId };

            var bookingsToConfirm = await _context.Bookings
                .Where(b => idsToConfirm.Contains(b.Id))
                .ToListAsync();

            foreach (var b in bookingsToConfirm)
                b.Status = BookingStatus.Confirmed;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "تم تأكيد الحجز — الدفع عند الوصول",
                paymentId = payment.Id,
                amount = payment.Amount,
                status = payment.Status,
                bookingConfirmed = true
            });
        }

        if (payment.PaymentMethod == PaymentMethod.Thawani)
        {
            var (sessionId, checkoutUrl) = await _thawani.CreateSessionAsync(
                payment.Amount,
                booking.Id,
                booking.CustomerName);

            payment.SessionId = sessionId;
            payment.CheckoutUrl = checkoutUrl;
            payment.Status = PaymentStatus.Pending;

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "تم إنشاء رابط الدفع عبر Thawani",
                paymentId = payment.Id,
                sessionId = payment.SessionId,
                checkoutUrl = payment.CheckoutUrl,
                amount = payment.Amount
            });
        }

        return BadRequest("طريقة الدفع غير صحيحة");
    }

    // PUT api/Payment/confirm/1
    [HttpPut("confirm/{id}")]
    public async Task<IActionResult> ConfirmPayment(int id, [FromQuery] string? bookingIds)
    {
        var payment = await _context.Payments
            .Include(p => p.Booking)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
            return NotFound("الدفع غير موجود");

        payment.Status = PaymentStatus.Paid;
        payment.TransactionId = Guid.NewGuid().ToString();

        if (payment.Booking != null)
            payment.Booking.Status = BookingStatus.Confirmed;

        if (!string.IsNullOrEmpty(bookingIds))
        {
            var ids = bookingIds.Split(',').Select(int.Parse);
            var related = await _context.Bookings
                .Where(b => ids.Contains(b.Id))
                .ToListAsync();
            foreach (var b in related)
                b.Status = BookingStatus.Confirmed;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "تم الدفع وتأكيد الحجز",
            paymentId = payment.Id,
            transactionId = payment.TransactionId
        });
    }

    // PUT api/Payment/fail/1
    [HttpPut("fail/{id}")]
    public async Task<IActionResult> FailPayment(int id)
    {
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null)
            return NotFound();

        payment.Status = PaymentStatus.Failed;
        await _context.SaveChangesAsync();
        return Ok("تم تسجيل فشل الدفع");
    }
}

public class CreatePaymentRequest
{
    public int BookingId { get; set; }
    public List<int>? BookingIds { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal? Amount { get; set; }
}
