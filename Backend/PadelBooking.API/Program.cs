using Microsoft.EntityFrameworkCore;
using PadelBooking.API.Data;
using PadelBooking.API.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);


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

// CORS for Frontend (Vite dev server)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
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

// Skip HTTPS redirect in development so Vite proxy can reach the API
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}


app.MapControllers();



app.Run();