namespace PadelBooking.API.Models;

public class Payment
{
    public int Id { get; set; }


    // الحجز
    public int BookingId { get; set; }

    public Booking? Booking { get; set; }



    // المبلغ
    public decimal Amount { get; set; }



    // طريقة الدفع
    public PaymentMethod PaymentMethod { get; set; }



    // حالة الدفع
    public PaymentStatus Status { get; set; }



    // بيانات ثواني
    public string? SessionId { get; set; }

    public string? CheckoutUrl { get; set; }



    // رقم العملية
    public string? TransactionId { get; set; }



    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}




public enum PaymentStatus
{
    Pending,
    Paid,
    Failed
}