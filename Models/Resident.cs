namespace MyTodoApi.Models;
public enum ResidentType
{
    Regular,
    VIP,
    Guest
}
public class Resident
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SurName { get; set; } = string.Empty;
    public ResidentType Type { get; set; } = ResidentType.Regular;
}
