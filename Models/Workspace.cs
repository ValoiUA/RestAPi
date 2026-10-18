namespace MyTodoApi.Models;
public enum RoomType
{
    Small,
    Medium,
    Big,
    Large
}

public enum Status
{
    Unactive,
    Pending,
    Active,
    Confirm,
    Canceled
}
public class Workspace
{
    public int Id { get; set; }
    public bool IsActive { get; set; } = true;
    public RoomType RoomType { get; set; } = RoomType.Small;
    public int MaxCapacity { get; set; } = 4;
}
