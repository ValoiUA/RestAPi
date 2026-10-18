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
    public List<DateTime>? CreatedAt { get; set; } = [];
    public List<DateTime>? DuringDate { get; set; } = [];
    public string Status {get; set;} = "UnAcеive";

}
