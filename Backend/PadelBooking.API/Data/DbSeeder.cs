using PadelBooking.API.Models;

namespace PadelBooking.API.Data;

public static class DbSeeder
{
    public static void Seed(ApplicationDbContext db)
    {
        if (!db.Users.Any(u => u.Email == "admin@padel.com"))
        {
            db.Users.Add(new User
            {
                Name = "مدير النظام",
                Email = "admin@padel.com",
                Phone = "0500000000",
                Password = "admin123",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!db.Users.Any(u => u.Email == "customer@padel.com"))
        {
            db.Users.Add(new User
            {
                Name = "عميل تجريبي",
                Email = "customer@padel.com",
                Phone = "0512345678",
                Password = "123456",
                Role = UserRole.Customer,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!db.Courts.Any())
        {
            db.Courts.Add(new Court
            {
                Name = "ملعب 1",
                Description = "ملعب بادل داخلي مكيف",
                PricePerHour = 15,
                OpeningTime = new TimeSpan(8, 0, 0),
                ClosingTime = new TimeSpan(23, 0, 0),
                IsActive = true
            });

            db.Courts.Add(new Court
            {
                Name = "ملعب 2",
                Description = "ملعب بادل خارجي",
                PricePerHour = 20,
                OpeningTime = new TimeSpan(8, 0, 0),
                ClosingTime = new TimeSpan(23, 0, 0),
                IsActive = true
            });
        }

        db.SaveChanges();
    }
}
