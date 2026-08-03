using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Cloud hosting (Render/Railway): bind to platform PORT
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://+:{port}");

// Optional single FRONTEND_URL env var for CORS + Thawani callbacks
var frontendUrl = builder.Configuration["FRONTEND_URL"]
    ?? builder.Configuration["Frontend:BaseUrl"];


// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite("Data Source=PadelBooking.db"));


// Controllers + JSON (TimeSpan + Enums)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// CORS — allow configured frontend origins (demo: Vite dev + preview + production)
var allowedOrigins = builder.Configuration
    .GetSection("Frontend:AllowedOrigins")
    .Get<string[]>()?.ToList() ?? new List<string>();

if (!string.IsNullOrWhiteSpace(frontendUrl) && !allowedOrigins.Contains(frontendUrl))
    allowedOrigins.Add(frontendUrl);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins.Count > 0)
        {
            policy.WithOrigins(allowedOrigins.ToArray())
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});


// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHttpClient<ThawaniService>();


var app = builder.Build();



// إنشاء قاعدة البيانات والجداول تلقائياً
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<ApplicationDbContext>();

    db.Database.EnsureCreated();
    DbSeeder.Seed(db);

    try { db.Database.ExecuteSqlRaw("ALTER TABLE Payments ADD COLUMN SessionId TEXT"); } catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE Payments ADD COLUMN CheckoutUrl TEXT"); } catch { }
}



// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}



app.UseCors();

if (builder.Configuration.GetValue("UseHttpsRedirection", false))
{
    app.UseHttpsRedirection();
}


app.MapControllers();



app.Run();