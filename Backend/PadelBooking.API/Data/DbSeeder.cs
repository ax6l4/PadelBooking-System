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
            var court1 = new Court
            {
                Name = "ملعب 1",
                Description = "ملعب بادل داخلي مكيف",
                PricePerHour = 10,
                OpeningTime = new TimeSpan(8, 0, 0),
                ClosingTime = new TimeSpan(23, 0, 0),
                IsActive = true
            };

            var court2 = new Court
            {
                Name = "ملعب 2",
                Description = "ملعب بادل خارجي",
                PricePerHour = 10,
                OpeningTime = new TimeSpan(8, 0, 0),
                ClosingTime = new TimeSpan(23, 0, 0),
                IsActive = true
            };

            var court3 = new Court
            {
                Name = "ملعب VIP",
                Description = "ملعب فاخر",
                PricePerHour = 10,
                OpeningTime = new TimeSpan(9, 0, 0),
                ClosingTime = new TimeSpan(22, 0, 0),
                IsActive = true
            };

            db.Courts.AddRange(court1, court2, court3);
            db.SaveChanges();

            // عرض: ساعتان فأكثر = 8 ر.ع للساعة
            foreach (var court in new[] { court1, court2, court3 })
            {
                db.Offers.Add(new Offer
                {
                    CourtId = court.Id,
                    MinimumHours = 2,
                    PricePerHour = 8,
                    StartDate = new DateTime(2026, 1, 1),
                    EndDate = new DateTime(2027, 12, 31),
                    IsActive = true
                });
            }
        }
        else if (!db.Offers.Any())
        {
            foreach (var court in db.Courts.Where(c => c.IsActive).ToList())
            {
                db.Offers.Add(new Offer
                {
                    CourtId = court.Id,
                    MinimumHours = 2,
                    PricePerHour = 8,
                    StartDate = new DateTime(2026, 1, 1),
                    EndDate = new DateTime(2027, 12, 31),
                    IsActive = true
                });
            }
        }

        db.SaveChanges();
    }
}
