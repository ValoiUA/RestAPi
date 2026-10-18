namespace MyTodoApi.Models;

public record CreateBookingDTO(
    int WorkspaceId,
    string ResidentName,
    string ResidentSurName,
    DateTime BookingDate,
    int DurationMinutes,
    int ResidentCount
);