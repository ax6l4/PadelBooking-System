using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.Models;

namespace PadelBooking.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CourtController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CourtController(ApplicationDbContext context)
    {
        _context = context;
    }

    private static TimeSpan ParseTime(string? time, TimeSpan fallback)
    {
        if (string.IsNullOrWhiteSpace(time))
            return fallback;

        if (TimeSpan.TryParse(time, out var result))
            return result;

        return fallback;
    }

    // GET: api/Court
    [HttpGet]
    public async Task<IActionResult> GetCourts()
    {
        var courts = await _context.Courts.ToListAsync();
        return Ok(courts);
    }

    // GET: api/Court/1
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCourt(int id)
    {
        var court = await _context.Courts.FirstOrDefaultAsync(c => c.Id == id);

        if (court == null)
            return NotFound("الملعب غير موجود");

        return Ok(court);
    }

    // POST: api/Court
    [HttpPost]
    public async Task<IActionResult> CreateCourt([FromBody] CourtRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("اسم الملعب مطلوب");

        var court = new Court
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? "",
            PricePerHour = request.PricePerHour > 0 ? request.PricePerHour : 15,
            OpeningTime = ParseTime(request.OpeningTime, new TimeSpan(8, 0, 0)),
            ClosingTime = ParseTime(request.ClosingTime, new TimeSpan(23, 0, 0)),
            IsActive = request.IsActive
        };

        _context.Courts.Add(court);
        await _context.SaveChangesAsync();

        return Ok(court);
    }

    // PUT: api/Court/1
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCourt(int id, [FromBody] CourtRequest request)
    {
        var court = await _context.Courts.FirstOrDefaultAsync(c => c.Id == id);

        if (court == null)
            return NotFound("الملعب غير موجود");

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("اسم الملعب مطلوب");

        court.Name = request.Name.Trim();
        court.Description = request.Description?.Trim() ?? "";
        court.PricePerHour = request.PricePerHour > 0 ? request.PricePerHour : court.PricePerHour;
        court.OpeningTime = ParseTime(request.OpeningTime, court.OpeningTime);
        court.ClosingTime = ParseTime(request.ClosingTime, court.ClosingTime);
        court.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(court);
    }

    // DELETE: api/Court/1
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCourt(int id)
    {
        var court = await _context.Courts.FirstOrDefaultAsync(c => c.Id == id);

        if (court == null)
            return NotFound("الملعب غير موجود");

        var hasBookings = await _context.Bookings.AnyAsync(b => b.CourtId == id);

        if (hasBookings)
            return BadRequest("لا يمكن حذف الملعب — يوجد حجوزات مرتبطة به");

        _context.Courts.Remove(court);
        await _context.SaveChangesAsync();

        return Ok("تم حذف الملعب");
    }
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
