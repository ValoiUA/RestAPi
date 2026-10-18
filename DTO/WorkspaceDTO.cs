namespace MyTodoApi.DTO;

using MyTodoApi.Models;

public record WorkspaceDTO(
    bool IsActive,
    RoomType RoomType,
    int MaxCapacity
);