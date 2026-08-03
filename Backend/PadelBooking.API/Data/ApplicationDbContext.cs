using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Models;

namespace PadelBooking.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }


    public DbSet<Court> Courts { get; set; }

    public DbSet<CourtWorkingHour> CourtWorkingHours { get; set; }

    public DbSet<CourtClosure> CourtClosures { get; set; }

    public DbSet<Offer> Offers { get; set; }

    public DbSet<Booking> Bookings { get; set; }

    public DbSet<Payment> Payments { get; set; }

    // المستخدمين
    public DbSet<User> Users { get; set; }
}