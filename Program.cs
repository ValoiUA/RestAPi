var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var booking = new List<Booking>();

//Get request to get all bookings
app.MapGet("/api/booking", () => booking);

app.MapGet("/api/booking/{id}", (int id) =>
{
    var bookingItem = booking.FirstOrDefault(b => b.Id == id);
    return bookingItem is not null ? Results.Ok(bookingItem) : Results.NotFound();
});

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}


public class Resident
{
    public int Id { get; set; }
    public string? Name { get; set; } = null;
    public string? SurName { get; set; } = null;
    public string? Email { get; set; } = null;
}

public class Workspace
{
    public int Id { get; set; }
    public string? Name { get; set; } = null;
    public string? Description { get; set; } = null;
}

public class Booking
{
    public int Id {get; set; }
    public int TimeBooking {get; set; }
    public int ResidentName {get; set; }
    public bool IsActive {get; set;} = false;
    public int ResidentMaxCount {get; set;}
    public int HourlyMoney {get; set;}

}