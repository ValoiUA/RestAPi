using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.OpenApi.Models;
using MyTodoApi.DTO;
using MyTodoApi.Models;
using MyTodoApi.Validators;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Coworking Management API",
        Version = "v1",
        Description = "API для бронювання робочих зон, керування кімнатами та резидентами"
    });
});

builder.Services.AddScoped<IValidator<CreateBookingDTO>, CreateBookingValidator>();

builder.Services.ConfigureHttpJsonOptions(opt =>
{
    opt.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

var jsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    WriteIndented = true
};
jsonOptions.Converters.Add(new JsonStringEnumConverter());

async Task<List<T>> ReadFromJsonFileAsync<T>(string fileName)
{
    var path = Path.Combine(builder.Environment.ContentRootPath, fileName);
    if (!File.Exists(path)) return new List<T>();

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

decimal GetHourlyRate(RoomType type) => type switch
{
    RoomType.Small => 100m,
    RoomType.Medium => 150m,
    RoomType.Big => 200m,
    RoomType.Large => 250m,
    _ => 100m
};

var bookingGroup = app.MapGroup("/api/bookings").WithTags("Bookings");

// 1. Створення заявки на бронювання (Pending + 15 хв слот)
bookingGroup.MapPost("/", async (CreateBookingDTO dto, IValidator<CreateBookingDTO> validator) =>
{
    var validationResult = await validator.ValidateAsync(dto);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
    }

    var workspaces = await ReadFromJsonFileAsync<Workspace>("workspace.json");
    var workspace = workspaces.FirstOrDefault(w => w.Id == dto.WorkspaceId);

    if (workspace is null)
        return Results.NotFound("Робочу зону не знайдено.");

    if (!workspace.IsActive)
        return Results.BadRequest("Робоча зона не доступна для бронювання (неактивна).");

    if (dto.ResidentCount > workspace.MaxCapacity)
        return Results.BadRequest($"Кількість учасників ({dto.ResidentCount}) перевищує місткість зони ({workspace.MaxCapacity}).");

    var bookings = await ReadFromJsonFileAsync<Booking>("booking.json");
    var now = DateTime.UtcNow;

    // Очищення протермінованих Pending слотів
    foreach (var b in bookings.Where(b => b.Status == BookingStatus.Pending && b.PaymentDeadline < now))
    {
        b.Status = BookingStatus.Cancelled;
    }

    var requestedStart = dto.BookingDate;
    var requestedEnd = dto.BookingDate.AddMinutes(dto.DurationMinutes);

    // Перевірка накладання інтервалів: (StartA < EndB) && (EndA > StartB)
    bool hasCollision = bookings.Any(b =>
        b.WorkspaceId == dto.WorkspaceId &&
        (b.Status == BookingStatus.Confirmed || (b.Status == BookingStatus.Pending && b.PaymentDeadline >= now)) &&
        requestedStart < b.BookingDate.AddMinutes(b.DurationMinutes) &&
        requestedEnd > b.BookingDate);

    if (hasCollision)
    {
        return Results.Conflict("Обраний інтервал часу вже зарезервовано або очікує підтвердження.");
    }

    var newBooking = new Booking
    {
        Id = bookings.Count == 0 ? 1 : bookings.Max(b => b.Id) + 1,
        WorkspaceId = dto.WorkspaceId,
        ResidentName = dto.ResidentName,
        ResidentSurName = dto.ResidentSurName,
        BookingDate = requestedStart,
        DurationMinutes = dto.DurationMinutes,
        ResidentCount = dto.ResidentCount,
        Status = BookingStatus.Pending,
        CreatedAt = now,
        PaymentDeadline = now.AddMinutes(15)
    };

    bookings.Add(newBooking);
    await WriteToJsonFileAsync("booking.json", bookings);

    return Results.Created($"/api/bookings/{newBooking.Id}", new
    {
        Status = "Pending",
        BookingId = newBooking.Id,
        newBooking.BookingDate,
        EndsAt = requestedEnd,
        newBooking.PaymentDeadline,
        Message = "Слот заблоковано на 15 хвилин для оплати."
    });
}).WithSummary("Створити заявку на бронювання");

// 2. Підтвердження та розрахунок вартості бронювання
bookingGroup.MapPost("/{id}/confirm", async (int id) =>
{
    var bookings = await ReadFromJsonFileAsync<Booking>("booking.json");
    var booking = bookings.FirstOrDefault(b => b.Id == id);

    if (booking is null)
        return Results.NotFound("Бронювання не знайдено.");

    if (booking.Status != BookingStatus.Pending)
        return Results.BadRequest($"Неможливо підтвердити бронювання у статусі '{booking.Status}'.");

    if (DateTime.UtcNow > booking.PaymentDeadline)
    {
        booking.Status = BookingStatus.Cancelled;
        await WriteToJsonFileAsync("booking.json", bookings);
        return Results.BadRequest("15-хвилинне вікно на оплату вичерпано. Бронювання скасовано.");
    }

    var workspaces = await ReadFromJsonFileAsync<Workspace>("workspace.json");
    var workspace = workspaces.FirstOrDefault(w => w.Id == booking.WorkspaceId);
    if (workspace is null) return Results.NotFound("Зону бронювання не знайдено.");

    var residents = await ReadFromJsonFileAsync<Resident>("residents.json");
    var resident = residents.FirstOrDefault(r =>
        string.Equals(r.Name, booking.ResidentName, StringComparison.OrdinalIgnoreCase) &&
        string.Equals(r.SurName, booking.ResidentSurName, StringComparison.OrdinalIgnoreCase));

    decimal hours = booking.DurationMinutes / 60m;
    decimal hourlyRate = GetHourlyRate(workspace.RoomType);
    decimal basePrice = hours * hourlyRate;

    bool isFullDay = hours >= 8.0m;
    bool isPremium = resident != null && resident.Type == ResidentType.VIP;

    decimal discountAmount = 0m;
    if (isFullDay || isPremium)
    {
        discountAmount = basePrice * 0.20m;
    }

    decimal cleaningFee = 0m;
    if (booking.ResidentCount > 6)
    {
        cleaningFee = 200m;
    }

    decimal totalPrice = (basePrice - discountAmount) + cleaningFee;

    booking.BasePrice = basePrice;
    booking.DiscountAmount = discountAmount;
    booking.CleaningFee = cleaningFee;
    booking.TotalPrice = totalPrice;
    booking.Status = BookingStatus.Confirmed;

    await WriteToJsonFileAsync("booking.json", bookings);

    return Results.Ok(new
    {
        Status = "Confirmed",
        BookingId = booking.Id,
        Hours = hours,
        BasePrice = basePrice,
        Discount = discountAmount,
        CleaningFee = cleaningFee,
        TotalPrice = totalPrice
    });
}).WithSummary("Підтвердити оплату та розрахувати фінальну вартість");

// 3. Скасування бронювання та правила компенсації
bookingGroup.MapPost("/{id}/cancel", async (int id) =>
{
    var bookings = await ReadFromJsonFileAsync<Booking>("booking.json");
    var booking = bookings.FirstOrDefault(b => b.Id == id);

    if (booking is null)
        return Results.NotFound("Бронювання не знайдено.");

    if (booking.Status != BookingStatus.Confirmed)
        return Results.BadRequest("Скасувати можна лише підтверджене бронювання (Confirmed).");

    var timeUntilStart = booking.BookingDate - DateTime.Now;

    if (timeUntilStart <= TimeSpan.Zero)
        return Results.BadRequest("Неможливо скасувати бронювання, час якого вже розпочався або минув.");

    decimal refundAmount;
    decimal penaltyAmount;

    if (timeUntilStart.TotalHours > 24)
    {
        refundAmount = booking.TotalPrice;
        penaltyAmount = 0m;
    }
    else
    {
        penaltyAmount = booking.TotalPrice * 0.50m;
        refundAmount = booking.TotalPrice * 0.50m;
    }

    booking.Status = BookingStatus.Cancelled;
    await WriteToJsonFileAsync("booking.json", bookings);

    return Results.Ok(new
    {
        Status = "Cancelled",
        BookingId = booking.Id,
        TotalPaid = booking.TotalPrice,
        Penalty = penaltyAmount,
        Refund = refundAmount,
        Message = penaltyAmount > 0
            ? "Скасовано менш ніж за 24 години до початку: утримано штраф 50%."
            : "Скасовано більш ніж за 24 години до початку: 100% повернення коштів."
    });
}).WithSummary("Скасувати підтверджене бронювання");

app.Run();