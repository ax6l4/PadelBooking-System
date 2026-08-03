namespace PadelBooking.API.Models;

public class CourtClosure
{
    public int Id { get; set; }

    // الملعب الذي سيتم إغلاقه
    public int CourtId { get; set; }

    public Court? Court { get; set; }

    // تاريخ الإغلاق
    public DateTime Date { get; set; }

    // إذا كان الإغلاق طوال اليوم يمكن تركها فارغة
    public TimeSpan? StartTime { get; set; }

    public TimeSpan? EndTime { get; set; }

    // سبب الإغلاق
    public string Reason { get; set; } = string.Empty;
}