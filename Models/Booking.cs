namespace MyTodoApi.Models;

public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled
}
public class Booking
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public string ResidentName { get; set; } = string.Empty;
    public string ResidentSurName { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; } // Час початку
    public int DurationMinutes { get; set; }  // Тривалість у хвилинах
    public int ResidentCount { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime PaymentDeadline { get; set; } // CreatedAt + 15 хв
    public decimal BasePrice { get; set; }
    public decimal CleaningFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalPrice { get; set; }
}