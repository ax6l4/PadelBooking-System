using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.DTOs;
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

    [HttpGet]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await _context.Payments
            .Include(p => p.Booking)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(payments);
    }

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
            Status = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        // —— الدفع عند الوصول ——
        if (payment.PaymentMethod == PaymentMethod.PayAtVenue)
        {
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

        // —— الدفع الإلكتروني عبر ثواني ——
        if (payment.PaymentMethod == PaymentMethod.Thawani)
        {
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            try
            {
                var (sessionId, checkoutUrl) = await _thawani.CreateSessionAsync(
                    payment.Amount,
                    payment.Id,
                    booking.Id,
                    booking.CustomerName,
                    booking.Phone,
                    booking.CustomerEmail);

                payment.SessionId = sessionId;
                payment.CheckoutUrl = checkoutUrl;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "تم إنشاء رابط الدفع عبر Thawani",
                    paymentId = payment.Id,
                    sessionId = payment.SessionId,
                    checkoutUrl = payment.CheckoutUrl,
                    amount = payment.Amount,
                    sandbox = _thawani.IsConfigured
                });
            }
            catch (Exception ex)
            {
                payment.Status = PaymentStatus.Failed;
                await _context.SaveChangesAsync();
                return BadRequest(ex.Message);
            }
        }

        return BadRequest("طريقة الدفع غير صحيحة");
    }

    /// <summary>
    /// تأكيد الدفع بعد العودة من ثواني.
    /// يتحقق من حالة الجلسة عبر API ثواني قبل تأكيد الحجز.
    /// </summary>
    [HttpPut("confirm/{id}")]
    public async Task<IActionResult> ConfirmPayment(int id, [FromQuery] string? bookingIds)
    {
        var payment = await _context.Payments
            .Include(p => p.Booking)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
            return NotFound("الدفع غير موجود");

        if (payment.Status == PaymentStatus.Paid)
        {
            return Ok(new
            {
                message = "تم الدفع وتأكيد الحجز مسبقاً",
                paymentId = payment.Id,
                transactionId = payment.TransactionId
            });
        }

        if (payment.PaymentMethod == PaymentMethod.Thawani)
        {
            if (string.IsNullOrWhiteSpace(payment.SessionId))
                return BadRequest("لا توجد جلسة دفع مرتبطة");

            try
            {
                var thawaniStatus = await _thawani.GetPaymentStatusAsync(payment.SessionId);
                if (thawaniStatus is not ("paid" or "successful" or "success"))
                {
                    if (thawaniStatus is "cancelled" or "canceled" or "failed")
                    {
                        payment.Status = PaymentStatus.Failed;
                        await _context.SaveChangesAsync();
                        return BadRequest("لم يكتمل الدفع عبر ثواني");
                    }

                    return BadRequest($"الدفع لم يكتمل بعد (الحالة: {thawaniStatus})");
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        payment.Status = PaymentStatus.Paid;
        payment.TransactionId ??= payment.SessionId ?? Guid.NewGuid().ToString();

        if (payment.Booking != null)
            payment.Booking.Status = BookingStatus.Confirmed;

        if (!string.IsNullOrEmpty(bookingIds))
        {
            var ids = bookingIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s.Trim(), out var n) ? n : 0)
                .Where(n => n > 0)
                .ToList();

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
