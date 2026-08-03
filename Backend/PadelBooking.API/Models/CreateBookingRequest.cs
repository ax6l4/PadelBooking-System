namespace PadelBooking.API.Models;

public class CreateBookingRequest
{
    public string Phone { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public DateTime BookingDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
}

public class BulkClosureRequest
{
    public List<int>? CourtIds { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    /// <summary>Optional: close only these weekdays (0=Sunday … 6=Saturday) within the date range.</summary>
    public List<int>? Weekdays { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
}
