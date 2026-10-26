using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using MyTodoApi.DTO;
using MyTodoApi.Models;
using MyTodoApi.Repositories;
using MyTodoApi.Services;
using MyTodoApi.Validators;
using Validators;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var connectionString = builder.Configuration.GetConnectionString("MongoDb");
    return new MongoClient(connectionString);
});

builder.Services.AddScoped<IMongoDatabase>(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    var dbName = builder.Configuration["DatabaseName"] ?? "CoworkingDb";
    return client.GetDatabase(dbName);
});


builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IResidentRepository, ResidentRepository>();
builder.Services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();

builder.Services.AddScoped<BookingSyncService>();

builder.Services.AddScoped<IValidator<BookingDTO>, BookingValidator>();
builder.Services.AddScoped<IValidator<ResidentDTO>, ResidentCreateDTOValidator>();
builder.Services.AddScoped<IValidator<WorkspaceDTO>, WorkspaceValidator>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Coworking Management API",
        Version = "v1"
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var syncService = scope.ServiceProvider.GetRequiredService<BookingSyncService>();
    await syncService.CleanupExpiredBookingsAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();