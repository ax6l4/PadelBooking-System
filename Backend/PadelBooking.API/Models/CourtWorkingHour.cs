namespace PadelBooking.API.Models;

public class CourtWorkingHour
{
    public int Id { get; set; }

    // الملعب المرتبط بهذا الوقت
    public int CourtId { get; set; }

    public Court? Court { get; set; }

    // يوم الأسبوع
    public DayOfWeek DayOfWeek { get; set; }

    // بداية الدوام
    public TimeSpan StartTime { get; set; }

    // نهاية الدوام
    public TimeSpan EndTime { get; set; }
}