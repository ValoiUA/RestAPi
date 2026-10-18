namespace MyTodoApi.Models;
public class Booking
{
    public int Id {get; set; }
    public DateTime BookingDate {get; set; } = DateTime.Now;
    public int TimeBooking {get; set; } = 60;
    public string? ResidentName {get; set; } = null;
    public string? ResidentSurName {get; set; } = null;
    public int ResidentMaxCount {get; set;} = 1;
    public int WorkspaceId {get; set;}
    public decimal TotalPrice {get; set;}

}