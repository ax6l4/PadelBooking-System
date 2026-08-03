namespace PadelBooking.API.Models;

public class Court
{
    public int Id { get; set; }

    // اسم الملعب
    public string Name { get; set; } = string.Empty;

    // الوصف
    public string Description { get; set; } = string.Empty;

    // السعر لكل ساعة
    public decimal PricePerHour { get; set; }

    // وقت الفتح
    public TimeSpan OpeningTime { get; set; }

    // وقت الإغلاق
    public TimeSpan ClosingTime { get; set; }

    // هل الملعب فعال
    public bool IsActive { get; set; } = true;


    // الحجوزات المرتبطة
    public ICollection<Booking>? Bookings { get; set; }

    // أوقات العمل
    public ICollection<CourtWorkingHour>? WorkingHours { get; set; }

    // الإغلاقات
    public ICollection<CourtClosure>? Closures { get; set; }
}