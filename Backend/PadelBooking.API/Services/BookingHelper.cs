using PadelBooking.API.Models;

namespace PadelBooking.API.Services;

public static class BookingHelper
{
    public static (TimeSpan Open, TimeSpan Close) GetCourtHours(
        Court court,
        DayOfWeek day,
        IEnumerable<CourtWorkingHour> workingHours)
    {
        var custom = workingHours.FirstOrDefault(w =>
            w.CourtId == court.Id && w.DayOfWeek == day);

        if (custom != null && custom.EndTime > custom.StartTime)
            return (custom.StartTime, custom.EndTime);

        return (court.OpeningTime, court.ClosingTime);
    }

    public static bool IsCourtClosed(
        int courtId,
        DateTime date,
        TimeSpan slotStart,
        TimeSpan slotEnd,
        IEnumerable<CourtClosure> closures)
    {
        return closures.Any(c =>
            c.CourtId == courtId &&
            c.Date.Date == date.Date &&
            (
                (c.StartTime == null && c.EndTime == null) ||
                (c.StartTime < slotEnd && c.EndTime > slotStart)
            ));
    }

    public static bool HasBookingConflict(
        int courtId,
        DateTime date,
        TimeSpan start,
        TimeSpan end,
        IEnumerable<Booking> bookings)
    {
        return bookings.Any(b =>
            b.CourtId == courtId &&
            b.BookingDate.Date == date.Date &&
            b.StartTime < end &&
            b.EndTime > start &&
            b.Status != BookingStatus.Cancelled);
    }

    public static bool IsCourtAvailableForSlot(
        Court court,
        DateTime date,
        TimeSpan slotStart,
        TimeSpan slotEnd,
        IEnumerable<CourtWorkingHour> workingHours,
        IEnumerable<CourtClosure> closures,
        IEnumerable<Booking> bookings)
    {
        if (!court.IsActive)
            return false;

        var (open, close) = GetCourtHours(court, date.DayOfWeek, workingHours);

        if (slotStart < open || slotEnd > close)
            return false;

        if (IsCourtClosed(court.Id, date, slotStart, slotEnd, closures))
            return false;

        if (HasBookingConflict(court.Id, date, slotStart, slotEnd, bookings))
            return false;

        return true;
    }

    public static Court? PickRandomAvailableCourt(
        DateTime date,
        TimeSpan start,
        TimeSpan end,
        IEnumerable<Court> courts,
        IEnumerable<CourtWorkingHour> workingHours,
        IEnumerable<CourtClosure> closures,
        IEnumerable<Booking> bookings)
    {
        var available = courts
            .Where(c => IsCourtAvailableForSlot(c, date, start, end, workingHours, closures, bookings))
            .ToList();

        if (available.Count == 0)
            return null;

        return available[Random.Shared.Next(available.Count)];
    }

    public static decimal CalculatePrice(
        Court court,
        int totalHours,
        DateTime bookingDate,
        IEnumerable<Offer> offers)
    {
        var bestOffer = offers
            .Where(o =>
                o.CourtId == court.Id &&
                o.IsActive &&
                bookingDate.Date >= o.StartDate.Date &&
                bookingDate.Date <= o.EndDate.Date &&
                totalHours >= o.MinimumHours)
            .OrderByDescending(o => o.MinimumHours)
            .FirstOrDefault();

        if (bestOffer != null)
            return totalHours * bestOffer.PricePerHour;

        return totalHours * court.PricePerHour;
    }

    public static int GetMinHour(IEnumerable<Court> courts, DayOfWeek day, IEnumerable<CourtWorkingHour> workingHours)
    {
        if (!courts.Any())
            return 8;

        return courts
            .Where(c => c.IsActive)
            .Select(c =>
            {
                var (open, close) = GetCourtHours(c, day, workingHours);
                return open.Hours;
            })
            .DefaultIfEmpty(8)
            .Min();
    }

    public static int GetMaxHour(IEnumerable<Court> courts, DayOfWeek day, IEnumerable<CourtWorkingHour> workingHours)
    {
        if (!courts.Any())
            return 23;

        return courts
            .Where(c => c.IsActive)
            .Select(c =>
            {
                var (open, close) = GetCourtHours(c, day, workingHours);
                return close.Hours;
            })
            .DefaultIfEmpty(23)
            .Max();
    }
}
