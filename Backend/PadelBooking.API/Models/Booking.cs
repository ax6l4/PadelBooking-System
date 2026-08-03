namespace PadelBooking.API.Models;

public class Booking
{
    public int Id { get; set; }

    public string Phone { get; set; } = string.Empty;

    public string? CustomerName { get; set; }

    public string? CustomerEmail { get; set; }


    public int CourtId { get; set; }

    public Court? Court { get; set; }


    public DateTime BookingDate { get; set; }


    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }


    public int TotalHours { get; set; }


    public decimal TotalPrice { get; set; }


    public BookingStatus Status { get; set; }


    public PaymentMethod PaymentMethod { get; set; }


    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}



public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled,
    Completed
}



public enum PaymentMethod
{
    PayAtVenue,
    Thawani
}