namespace PadelBooking.API.Models;

public class CourtSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class BookingListDto
{
    public int Id { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public int CourtId { get; set; }
    public CourtSummaryDto? Court { get; set; }
    public DateTime BookingDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int TotalHours { get; set; }
    public decimal TotalPrice { get; set; }
    public BookingStatus Status { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CourtClosureListDto
{
    public int Id { get; set; }
    public int CourtId { get; set; }
    public CourtSummaryDto? Court { get; set; }
    public DateTime Date { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class CourtWorkingHourListDto
{
    public int Id { get; set; }
    public int CourtId { get; set; }
    public CourtSummaryDto? Court { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}
