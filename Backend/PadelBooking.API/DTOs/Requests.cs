using PadelBooking.API.Models;

namespace PadelBooking.API.DTOs;

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

public class CourtRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal PricePerHour { get; set; }
    public string OpeningTime { get; set; } = "08:00:00";
    public string ClosingTime { get; set; } = "23:00:00";
    public bool IsActive { get; set; } = true;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class CreatePaymentRequest
{
    public int BookingId { get; set; }
    public List<int>? BookingIds { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal? Amount { get; set; }
}
