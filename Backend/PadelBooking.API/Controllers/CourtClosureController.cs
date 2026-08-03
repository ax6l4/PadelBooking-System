using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.DTOs;
using PadelBooking.API.Models;

namespace PadelBooking.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CourtClosureController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CourtClosureController(ApplicationDbContext context)
    {
        _context = context;
    }




    // GET: api/CourtClosure
    [HttpGet]
    public async Task<IActionResult> GetClosures()
    {
        var closures = await _context.CourtClosures
            .OrderByDescending(c => c.Date)
            .Select(c => new CourtClosureListDto
            {
                Id = c.Id,
                CourtId = c.CourtId,
                Court = c.Court == null
                    ? null
                    : new CourtSummaryDto { Id = c.Court.Id, Name = c.Court.Name },
                Date = c.Date,
                StartTime = c.StartTime,
                EndTime = c.EndTime,
                Reason = c.Reason
            })
            .ToListAsync();

        return Ok(closures);
    }





    // GET: api/CourtClosure/1
    [HttpGet("{id}")]
    public async Task<IActionResult> GetClosure(int id)
    {
        var closure = await _context.CourtClosures
            .Include(c => c.Court)
            .FirstOrDefaultAsync(c => c.Id == id);



        if (closure == null)
            return NotFound("الإغلاق غير موجود");

        return Ok(new CourtClosureListDto
        {
            Id = closure.Id,
            CourtId = closure.CourtId,
            Court = closure.Court == null
                ? null
                : new CourtSummaryDto { Id = closure.Court.Id, Name = closure.Court.Name },
            Date = closure.Date,
            StartTime = closure.StartTime,
            EndTime = closure.EndTime,
            Reason = closure.Reason
        });
    }





    // POST: api/CourtClosure
    [HttpPost]
    public async Task<IActionResult> CreateClosure(CourtClosure closure)
    {
        var court = await _context.Courts
            .FirstOrDefaultAsync(c => c.Id == closure.CourtId);



        if (court == null)
            return BadRequest("الملعب غير موجود");



        _context.CourtClosures.Add(closure);

        await _context.SaveChangesAsync();



        return Ok(closure);
    }





    // PUT: api/CourtClosure/1
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClosure(int id, CourtClosure model)
    {
        var closure = await _context.CourtClosures
            .FirstOrDefaultAsync(c => c.Id == id);



        if (closure == null)
            return NotFound("الإغلاق غير موجود");



        closure.CourtId = model.CourtId;
        closure.Date = model.Date;
        closure.StartTime = model.StartTime;
        closure.EndTime = model.EndTime;
        closure.Reason = model.Reason;



        await _context.SaveChangesAsync();


        return Ok(closure);
    }





    // DELETE: api/CourtClosure/1
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClosure(int id)
    {
        var closure = await _context.CourtClosures
            .FirstOrDefaultAsync(c => c.Id == id);



        if (closure == null)
            return NotFound("الإغلاق غير موجود");



        _context.CourtClosures.Remove(closure);

        await _context.SaveChangesAsync();



        return Ok("تم حذف الإغلاق");
    }

    // POST: api/CourtClosure/bulk — إغلاق ملعب/عدة ملاعب/كل الملاعب لفترة
    [HttpPost("bulk")]
    public async Task<IActionResult> CreateBulkClosure([FromBody] BulkClosureRequest request)
    {
        if (request.EndDate.Date < request.StartDate.Date)
            return BadRequest("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");

        var courtIds = request.CourtIds?.Any() == true
            ? request.CourtIds
            : await _context.Courts.Select(c => c.Id).ToListAsync();

        if (courtIds.Count == 0)
            return BadRequest("لا توجد ملاعب");

        var created = new List<CourtClosure>();

        for (var date = request.StartDate.Date; date <= request.EndDate.Date; date = date.AddDays(1))
        {
            if (request.Weekdays?.Any() == true &&
                !request.Weekdays.Contains((int)date.DayOfWeek))
                continue;

            foreach (var courtId in courtIds)
            {
                var exists = await _context.Courts.AnyAsync(c => c.Id == courtId);
                if (!exists) continue;

                var closure = new CourtClosure
                {
                    CourtId = courtId,
                    Date = date,
                    StartTime = request.StartTime,
                    EndTime = request.EndTime,
                    Reason = request.Reason ?? ""
                };
                _context.CourtClosures.Add(closure);
                created.Add(closure);
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"تم إغلاق {created.Count} فترة", count = created.Count });
    }
}