using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.Models;

namespace PadelBooking.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OfferController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OfferController(ApplicationDbContext context)
    {
        _context = context;
    }





    // GET: api/Offer
    [HttpGet]
    public async Task<IActionResult> GetOffers()
    {
        var offers = await _context.Offers
            .Include(o => o.Court)
            .ToListAsync();


        return Ok(offers);
    }





    // GET: api/Offer/1
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOffer(int id)
    {
        var offer = await _context.Offers
            .Include(o => o.Court)
            .FirstOrDefaultAsync(o => o.Id == id);



        if (offer == null)
            return NotFound("العرض غير موجود");



        return Ok(offer);
    }





    // POST: api/Offer
    [HttpPost]
    public async Task<IActionResult> CreateOffer(Offer offer)
    {
        var court = await _context.Courts
            .FirstOrDefaultAsync(c => c.Id == offer.CourtId);



        if (court == null)
            return BadRequest("الملعب غير موجود");



        offer.IsActive = true;



        _context.Offers.Add(offer);

        await _context.SaveChangesAsync();



        return Ok(offer);
    }





    // PUT: api/Offer/1
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOffer(int id, Offer model)
    {
        var offer = await _context.Offers
            .FirstOrDefaultAsync(o => o.Id == id);



        if (offer == null)
            return NotFound("العرض غير موجود");



        offer.CourtId = model.CourtId;
        offer.MinimumHours = model.MinimumHours;
        offer.PricePerHour = model.PricePerHour;
        offer.StartDate = model.StartDate;
        offer.EndDate = model.EndDate;
        offer.IsActive = model.IsActive;



        await _context.SaveChangesAsync();



        return Ok(offer);
    }





    // DELETE: api/Offer/1
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOffer(int id)
    {
        var offer = await _context.Offers
            .FirstOrDefaultAsync(o => o.Id == id);



        if (offer == null)
            return NotFound("العرض غير موجود");



        _context.Offers.Remove(offer);

        await _context.SaveChangesAsync();



        return Ok("تم حذف العرض");
    }
}