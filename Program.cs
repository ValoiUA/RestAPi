using System.Text.Json;
using System.Text.Json.Serialization;

using MyTodoApi.Models;
using MyTodoApi.DTO;
using MyTodoApi.Validators;
using Microsoft.OpenApi.Models;
using FluentValidation;
using Validators;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IValidator<BookingDTO>, BookingValidator>();
builder.Services.AddScoped<IValidator<ResidentDTO>, ResidentCreateDTOValidator>();
builder.Services.AddScoped<IValidator<WorkspaceDTO>, WorkspaceValidator>();

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Coworking Management API",
        Version = "v1",
        Description = "API для бронювання робочих зон, керування кімнатами та резидентами"
    });
});
builder.Services.ConfigureHttpJsonOptions(opt =>
{
    opt.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

var jsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true
};
jsonOptions.Converters.Add(new JsonStringEnumConverter());

async Task<List<T>> ReadFromJsonFileAsync<T>(string fileName)
{
    var path = Path.Combine(builder.Environment.ContentRootPath, fileName);
    if (!File.Exists(path))
    {
        return new List<T>();
    }

    using var stream = File.OpenRead(path);
    return await JsonSerializer.DeserializeAsync<List<T>>(stream, jsonOptions) ?? new List<T>();
}
async Task WriteToJsonFileAsync<T>(string fileName, List<T> data)
{
    var path = Path.Combine(builder.Environment.ContentRootPath, fileName);
    using var stream = File.Create(path); 
    await JsonSerializer.SerializeAsync(stream, data, jsonOptions);
}


var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

void syncActiveRooms()
{
    var workspaces = ReadFromJsonFileAsync<Workspace>("workspace.json").Result;
    var bookings = ReadFromJsonFileAsync<Booking>("booking.json").Result;

    foreach (var workspace in workspaces)
    {
        foreach (var booking in bookings)
        {
            if (booking.WorkspaceId == workspace.Id)
            {
                var bookingStart = booking.BookingDate;
                var bookingEnd = booking.BookingDate.AddMinutes(booking.TimeBooking);
                if (DateTime.Now >= bookingStart && DateTime.Now <= bookingEnd)
                {
                    workspace.IsActive = false;
                    break;
                }
            }
        }
    }

    WriteToJsonFileAsync("workspace.json", workspaces).Wait();
}

syncActiveRooms();
//WORKSPACES
var workspaceGroup = app.MapGroup("/api/workspaces").WithTags("1. Workspaces");
workspaceGroup.MapGet("/", async () =>
{
    var workspaces = await ReadFromJsonFileAsync<Workspace>("workspace.json");
    return Results.Ok(workspaces);
}).WithSummary("Отриматт всі робочі зони");

workspaceGroup.MapPost("/", async (
    WorkspaceDTO dto,
    IValidator<WorkspaceDTO> validator) =>
{
    var result = await validator.ValidateAsync(dto);
    if (!result.IsValid) return Results.BadRequest(result.Errors.Select(e => e.ErrorMessage));
    var workspaces = await ReadFromJsonFileAsync<Workspace>("workspace.json");
    workspaces.Add(new Workspace
    {
        Id = workspaces.Count == 0 ? 1 : workspaces.Max(w => w.Id) + 1,
        IsActive = dto.IsActive,
        RoomType = dto.RoomType,
        CreatedAt = dto.CreatedAt,
        DuringDate = dto.DuringDate
    });

    await WriteToJsonFileAsync("workspace.json", workspaces);

    return Results.Ok(new { Status = "Success" });
}).WithSummary("Додати нову робочу зону");



workspaceGroup.MapDelete("/{id}", async(int id) =>
{
    var workspaces = await ReadFromJsonFileAsync<Workspace>("workspace.json");
    var workspaceToDelete = workspaces.FirstOrDefault(w => w.Id == id);
    if (workspaceToDelete is null)
    {
        return Results.NotFound();
    }
    workspaces.Remove(workspaceToDelete);
    await WriteToJsonFileAsync("workspaces.json", workspaces);
    return Results.Ok(new { Status = "Deleted" });
}).WithSummary("Видалит робочу зону по айді");




//Booking
var bookingGroup = app.MapGroup("/api/booking").WithTags("2. Booking");
bookingGroup.MapGet("/", async () => await ReadFromJsonFileAsync<Booking>("booking.json")).WithSummary("Отримати всі бронювання");


bookingGroup.MapGet("/{id}", async(int id) =>
{
   var bookings = await ReadFromJsonFileAsync<Booking>("booking.json");
   var bookingItem = bookings.FirstOrDefault(b => b.Id == id);
   return bookingItem is not null ? Results.Ok(bookingItem) : Results.NotFound();
}).WithSummary("Отримати бронювання по айді");

bookingGroup.MapPost("/", async (BookingDTO newBookingDto,
IValidator<BookingDTO> validator) =>
{
    var validationResult = await validator.ValidateAsync(newBookingDto);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
    }

    var bookings = await ReadFromJsonFileAsync<Booking>("booking.json");
    var workspaces = await ReadFromJsonFileAsync<Workspace>("workspace.json");
    var residents = await ReadFromJsonFileAsync<Resident>("residents.json");

    RoomType requiredRoomType;
    if (newBookingDto.ResidentMaxCount > 1 && newBookingDto.ResidentMaxCount <= 4)
        requiredRoomType = RoomType.Small;
    else if (newBookingDto.ResidentMaxCount > 4 && newBookingDto.ResidentMaxCount <= 8)
        requiredRoomType = RoomType.Medium;
    else if (newBookingDto.ResidentMaxCount > 8 && newBookingDto.ResidentMaxCount <= 12)
        requiredRoomType = RoomType.Big;
    else if (newBookingDto.ResidentMaxCount > 12 && newBookingDto.ResidentMaxCount <= 15)
        requiredRoomType = RoomType.Large;
    else
        return Results.BadRequest("Invalid resident max count. It should be greater than 1 and less than or equal to 15.");

    var availableWorkspace = workspaces.FirstOrDefault(w => w.IsActive && w.RoomType == requiredRoomType);
    if (availableWorkspace is null)
    {
        return Results.BadRequest($"No available {requiredRoomType.ToString().ToLower()} workspaces for the specified resident max count.");
    }

    availableWorkspace.CreatedAt ??= [];
    availableWorkspace.DuringDate ??= [];
    availableWorkspace.CreatedAt.Add(newBookingDto.BookingDate);
    availableWorkspace.DuringDate.Add(newBookingDto.BookingDate.AddMinutes(newBookingDto.TimeBooking));
    foreach (var booking in bookings)
    {
        if (booking.WorkspaceId == availableWorkspace.Id)
        {
            var bookingStart = newBookingDto.BookingDate;
            var bookingEnd = newBookingDto.BookingDate.AddMinutes(newBookingDto.TimeBooking);
            for(int i = 0; i < availableWorkspace.DuringDate.Count; i++)
            {
                if(bookingStart < availableWorkspace.DuringDate[i] && bookingEnd > availableWorkspace.DuringDate[i])
                {
                    return Results.BadRequest("The selected workspace is already booked for the specified time.");
                }
            }
        }
    }

    availableWorkspace.IsActive = false;
    
    decimal hours = (decimal)newBookingDto.TimeBooking;
    decimal hourlyRate = 0;
    if (availableWorkspace.RoomType == RoomType.Small) hourlyRate = 100;
    else if (availableWorkspace.RoomType == RoomType.Medium) hourlyRate = 150;
    else if (availableWorkspace.RoomType == RoomType.Big) hourlyRate = 200;
    else if (availableWorkspace.RoomType == RoomType.Large) hourlyRate = 250;
    decimal basePrice = hours * hourlyRate;

    var resident = residents.FirstOrDefault(r => 
        string.Equals(r.Name, newBookingDto.ResidentName, StringComparison.OrdinalIgnoreCase) &&
        string.Equals(r.SurName, newBookingDto.ResidentSurName, StringComparison.OrdinalIgnoreCase));

    bool isPremium = resident != null && resident.Type == ResidentType.VIP;
    bool isFullDay = hours >= 8;

    decimal finalPrice = basePrice;
    if (isFullDay || isPremium)
    {
        finalPrice *= 0.8m;
    }
    decimal cleaningFee = 0m;
    if (newBookingDto.ResidentMaxCount > 6)
    {
        cleaningFee = 200m;
        finalPrice += cleaningFee;
    }
    var newBooking = new Booking
    {
        Id = bookings.Count == 0 ? 1 : bookings.Max(b => b.Id) + 1,
        BookingDate = newBookingDto.BookingDate,
        TimeBooking = newBookingDto.TimeBooking,
        ResidentName = newBookingDto.ResidentName,
        ResidentSurName = newBookingDto.ResidentSurName,
        ResidentMaxCount = newBookingDto.ResidentMaxCount,
        WorkspaceId = availableWorkspace.Id,
        TotalPrice = finalPrice 
    };

    bookings.Add(newBooking);

    await WriteToJsonFileAsync("booking.json", bookings);
    await WriteToJsonFileAsync("workspace.json", workspaces);

    return Results.Ok(new 
    { 
        Status = "Success", 
        BookingId = newBooking.Id,
        BasePrice = basePrice,
        DiscountApplied = isFullDay || isPremium,
        CleaningFee = cleaningFee,
        TotalPrice = finalPrice,
        StartTime = newBooking.BookingDate,
        EndTime = newBooking.BookingDate.AddMinutes(newBooking.TimeBooking)
    });
}).WithSummary("Додати бронювання");

bookingGroup.MapDelete("/{id}", async (int id) =>
{
    var bookings = await ReadFromJsonFileAsync<Booking>("booking.json");
    var bookingToDelete = bookings.FirstOrDefault(b => b.Id == id);
    decimal returnMoney = 0;
    if (bookingToDelete is null)
    {
        return Results.NotFound();
    }
    if(DateTime.Now - bookingToDelete.BookingDate > TimeSpan.FromHours(24))
    {
        returnMoney = bookingToDelete.TotalPrice;   
    }
    else if(DateTime.Now > bookingToDelete.BookingDate)
    {
        return Results.BadRequest("Cannot delete a booking that has already started.");
    }
    else
    {
        returnMoney = bookingToDelete.TotalPrice * 0.5m;
    }

    bookings.Remove(bookingToDelete);
    await WriteToJsonFileAsync("booking.json", bookings);

    var workspaces = await ReadFromJsonFileAsync<Workspace>("workspace.json");
    var workspaceToUpdate = workspaces.FirstOrDefault(w => w.Id == bookingToDelete.WorkspaceId);
    if (workspaceToUpdate is not null)
    {
        workspaceToUpdate.IsActive = true;
        await WriteToJsonFileAsync("workspace.json", workspaces);
    }

    return Results.Ok(new { Status = "Deleted", ReturnMoney = returnMoney });
}).WithSummary("Видалити бронювання по айді");


bookingGroup.MapDelete("/{surname},{name}", async(string surname, string name) =>
{
    var bookings = await ReadFromJsonFileAsync<Booking>("booking.json");
    var workspaces = await ReadFromJsonFileAsync<Workspace>("workspace.json");

    var bookingToDelete = bookings.FirstOrDefault(b => b.ResidentName == name && b.ResidentSurName == surname);
    decimal returnMoney = 0;
    if (bookingToDelete is null)
    {
        return Results.NotFound();
    }
    if(DateTime.Now - bookingToDelete.BookingDate > TimeSpan.FromHours(24))
    {
        returnMoney = bookingToDelete.TotalPrice;   
    }
    else if(DateTime.Now > bookingToDelete.BookingDate)
    {
        return Results.BadRequest("Cannot delete a booking that has already started.");
    }
    else
    {
        returnMoney = bookingToDelete.TotalPrice * 0.5m;
    }
    bookings.Remove(bookingToDelete);

    await WriteToJsonFileAsync("booking.json", bookings);
    var workspaceToUpdate = workspaces.FirstOrDefault(w => w.Id == bookingToDelete.WorkspaceId);
    if (workspaceToUpdate is not null)
    {
        workspaceToUpdate.IsActive = true;
        await WriteToJsonFileAsync("workspace.json", workspaces);
    }
    
    return Results.Ok(new { Status = "Deleted", ReturnMoney = returnMoney });

}).WithSummary("Видалити бронювання по прізвищу і імені");

var residentGroup = app.MapGroup("/api/residents").WithTags("3. Residents");

residentGroup.MapGet("/", async () =>
{
    var residents = await ReadFromJsonFileAsync<Resident>("residents.json");
    return Results.Ok(residents);
}).WithSummary("Отримати всіх резидентів");



residentGroup.MapPost("/", async (ResidentDTO newResidentDto,
IValidator<ResidentDTO> validator) =>
{
    var result = await validator.ValidateAsync(newResidentDto);

    if (!result.IsValid) return Results.BadRequest(result.Errors.Select(e => e.ErrorMessage));
;
    var residents = await ReadFromJsonFileAsync<Resident>("residents.json");

    residents.Add(new Resident{
        Id = residents.Count == 0 ? 1 : residents.Max(b => b.Id) + 1,
        Name = newResidentDto.Name,
        SurName = newResidentDto.SurName,
        Type = newResidentDto.Type
    });

    await WriteToJsonFileAsync("residents.json", residents);
    return Results.Ok(new {Status = "Successed"});
}).WithSummary("Додати нового резидента");


residentGroup.MapDelete("/{surname},{name}", async(string Surname, string Name) =>
{
   var residents = await ReadFromJsonFileAsync<Resident>("residents.json");
   foreach (var resident in residents)
    {
        if(resident.Name == Name && resident.SurName == Surname)
        {
            residents.Remove(resident);
            await WriteToJsonFileAsync("residents.json", residents);
            return Results.Ok(new { Status = "Deleted" });
        }
    }
    return Results.NotFound();
}).WithSummary("Видалити резидента по прізвищу і імені");

residentGroup.MapDelete("/{id}", async(int id) =>
{
    var residents = await ReadFromJsonFileAsync<Resident>("residents.json");
    var residentToDelete = residents.FirstOrDefault(r => r.Id == id);
    if (residentToDelete is null)
    {
        return Results.NotFound();
    }
    residents.Remove(residentToDelete);
    return Results.Ok(new { Status = "Deleted" });

}).WithSummary("Видалити резидента по айді");


app.Run();

