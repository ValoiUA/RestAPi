using MyTodoApi.Repositories;

namespace MyTodoApi.Services;

public class BookingSyncService
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IWorkspaceRepository _workspaceRepository;

    public BookingSyncService(IBookingRepository bookingRepository, IWorkspaceRepository workspaceRepository)
    {
        _bookingRepository = bookingRepository;
        _workspaceRepository = workspaceRepository;
    }

    public async Task CleanupExpiredBookingsAsync()
    {
        var now = DateTime.UtcNow;
        var allBookings = await _bookingRepository.GetAllAsync();
        var allWorkspaces = await _workspaceRepository.GetAllAsync();

      
        var expiredBookings = allBookings
            .Where(b => b.BookingDate.AddMinutes(b.TimeBooking) <= now)
            .ToList();

        foreach (var booking in expiredBookings)
        {
            var workspace = allWorkspaces.FirstOrDefault(w => w.Id == booking.WorkspaceId);
            if (workspace is not null)
            {
                var bookingEnd = booking.BookingDate.AddMinutes(booking.TimeBooking);
                workspace.CreatedAt?.RemoveAll(d => d == booking.BookingDate);
                workspace.DuringDate?.RemoveAll(d => d == bookingEnd);

                await _workspaceRepository.UpdateAsync(workspace.Id!, workspace);
            }

            await _bookingRepository.DeleteAsync(booking.Id!);
        }

        foreach (var ws in allWorkspaces)
        {
            bool modified = false;
            if (ws.DuringDate is not null && ws.DuringDate.Any(d => d <= now))
            {
                for (int i = ws.DuringDate.Count - 1; i >= 0; i--)
                {
                    if (ws.DuringDate[i] <= now)
                    {
                        ws.DuringDate.RemoveAt(i);
                        if (ws.CreatedAt is not null && ws.CreatedAt.Count > i)
                        {
                            ws.CreatedAt.RemoveAt(i);
                        }
                        modified = true;
                    }
                }
            }

            if (modified)
            {
                await _workspaceRepository.UpdateAsync(ws.Id!, ws);
            }
        }
    }
}