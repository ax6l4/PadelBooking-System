using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.DTOs;
using PadelBooking.API.Models;

namespace PadelBooking.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UserController(ApplicationDbContext context)
    {
        _context = context;
    }

    // POST: api/User/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(User user)
    {
        var exists = await _context.Users
            .AnyAsync(u => u.Email == user.Email);

        if (exists)
            return BadRequest("البريد مستخدم مسبقاً");

        user.Role = UserRole.Customer;
        user.CreatedAt = DateTime.UtcNow;

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            user.Phone,
            user.Role
        });
    }

    // POST: api/User/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Email == request.Email &&
                u.Password == request.Password);

        if (user == null)
            return Unauthorized("البريد أو كلمة المرور غير صحيحة");

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            user.Phone,
            user.Role
        });
    }

    // GET: api/User
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users.ToListAsync();
        return Ok(users);
    }
}
