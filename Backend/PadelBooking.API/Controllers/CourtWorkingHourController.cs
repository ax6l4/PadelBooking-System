using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.Models;

namespace PadelBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CourtWorkingHourController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CourtWorkingHourController(ApplicationDbContext context)
    {
        _context = context;
    }


    // عرض ساعات العمل
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CourtWorkingHourListDto>>> GetWorkingHours()
    {
        var hours = await _context.CourtWorkingHours
            .Select(w => new CourtWorkingHourListDto
            {
                Id = w.Id,
                CourtId = w.CourtId,
                Court = w.Court == null
                    ? null
                    : new CourtSummaryDto { Id = w.Court.Id, Name = w.Court.Name },
                DayOfWeek = w.DayOfWeek,
                StartTime = w.StartTime,
                EndTime = w.EndTime
            })
            .ToListAsync();

        return Ok(hours);
    }


    // إضافة وقت عمل
    [HttpPost]
    public async Task<ActionResult<CourtWorkingHour>> CreateWorkingHour(
        CourtWorkingHour workingHour)
    {
        _context.CourtWorkingHours.Add(workingHour);

        await _context.SaveChangesAsync();

        return Ok(workingHour);
    }


    // تعديل وقت العمل
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWorkingHour(
        int id,
        CourtWorkingHour workingHour)
    {
        if (id != workingHour.Id)
            return BadRequest();

        _context.Entry(workingHour).State = EntityState.Modified;

        await _context.SaveChangesAsync();

        return NoContent();
    }


    // حذف وقت العمل
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorkingHour(int id)
    {
        var hour = await _context.CourtWorkingHours.FindAsync(id);

        if (hour == null)
            return NotFound();

        _context.CourtWorkingHours.Remove(hour);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}