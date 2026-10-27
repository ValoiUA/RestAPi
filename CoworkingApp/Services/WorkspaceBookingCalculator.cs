using System.Text.RegularExpressions;

namespace CoworkingApp.Services;

public enum RoomType
{
    Small,
    Medium,
    Big,
    Large
}

public class ResidentDiscountInfo
{
    public string Tier { get; set; } = "Guest";
    public decimal DiscountPercent { get; set; }
}

public class WorkspaceBookingCalculator
{
    private static readonly ResidentDiscountInfo VipDiscountInstance = new() { Tier = "VIP", DiscountPercent = 20m };
    private static readonly ResidentDiscountInfo GuestDiscountInstance = new() { Tier = "Guest", DiscountPercent = 0m };

    // 1. Метод розрахунку вартості
    public decimal CalculatePrice(int timeMinutes, RoomType roomType, string residentTier, int guestsCount)
    {
        if (timeMinutes <= 0)
            throw new ArgumentOutOfRangeException(nameof(timeMinutes), "Тривалість бронювання має бути більшою за 0 хвилин.");

        if (guestsCount < 1 || guestsCount > 20)
            throw new ArgumentException("Кількість відвідувачів має бути в межах від 1 до 20.", nameof(guestsCount));

        decimal hourlyRate = roomType switch
        {
            RoomType.Small => 100m,
            RoomType.Medium => 150m,
            RoomType.Big => 200m,
            RoomType.Large => 250m,
            _ => throw new ArgumentOutOfRangeException(nameof(roomType), "Невідомий тип кімнати.")
        };

        decimal hours = (decimal)timeMinutes / 60m;
        decimal basePrice = hours * hourlyRate;

        // Знижка за VIP або повний день (>= 8 годин)
        if (string.Equals(residentTier, "VIP", StringComparison.OrdinalIgnoreCase) || hours >= 8)
        {
            basePrice *= 0.8m;
        }

        // Додатковий збір за прибирання, якщо понад 6 людей
        if (guestsCount > 6)
        {
            basePrice += 200m;
        }

        return Math.Round(basePrice, 2);
    }

    // 2. Метод підбору кімнати за кількістю людей
    public RoomType DetermineRequiredRoom(int count)
    {
        return count switch
        {
            >= 2 and <= 4 => RoomType.Small,
            >= 5 and <= 8 => RoomType.Medium,
            >= 9 and <= 12 => RoomType.Big,
            >= 13 and <= 15 => RoomType.Large,
            _ => throw new ArgumentOutOfRangeException(nameof(count), "Допустима місткість кімнат: від 2 до 15 осіб.")
        };
    }

    // 3. Метод перевірки доступності слота
    public bool IsTimeSlotAvailable(DateTime start, DateTime end, List<(DateTime Start, DateTime End)> bookedSlots)
    {
        if (end <= start)
            throw new ArgumentException("Час завершення має бути пізнішим за час початку.");

        return !bookedSlots.Any(b => start < b.End && end > b.Start);
    }

    // 4. Метод генерації квитанції/коду бронювання
    public string GenerateReceiptCode(string prefix, int bookingId)
    {
        if (string.IsNullOrWhiteSpace(prefix))
            throw new ArgumentNullException(nameof(prefix), "Префікс не може бути порожнім.");

        if (bookingId <= 0)
            throw new ArgumentOutOfRangeException(nameof(bookingId), "ID має бути більшим за нуль.");

        return $"{prefix.ToUpper()}-BOOK-{bookingId:D6}";
    }

    // 5. Метод отримання об'єкта знижки (для перевірки референсів та null)
    public ResidentDiscountInfo? GetDiscountDetails(string? residentTier)
    {
        if (string.IsNullOrWhiteSpace(residentTier))
            return null;

        if (residentTier.Equals("VIP", StringComparison.OrdinalIgnoreCase))
            return VipDiscountInstance;

        if (residentTier.Equals("Guest", StringComparison.OrdinalIgnoreCase))
            return GuestDiscountInstance;

        return new ResidentDiscountInfo { Tier = residentTier, DiscountPercent = 10m };
    }
}