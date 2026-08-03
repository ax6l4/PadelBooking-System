namespace PadelBooking.API.Models;

public class Offer
{
    public int Id { get; set; }

    // الملعب الذي يطبق عليه العرض
    public int CourtId { get; set; }

    public Court? Court { get; set; }

    // أقل عدد ساعات للحصول على العرض
    public int MinimumHours { get; set; }

    // السعر الجديد لكل ساعة
    public decimal PricePerHour { get; set; }

    // فترة صلاحية العرض
    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    // هل العرض فعال
    public bool IsActive { get; set; } = true;
}