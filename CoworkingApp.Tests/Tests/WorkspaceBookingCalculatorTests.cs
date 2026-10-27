using CoworkingApp.Services;
using Xunit;

namespace CoworkingApp.Tests.Tests;

public class WorkspaceBookingCalculatorTests
{
    private readonly WorkspaceBookingCalculator _calculator;

    public WorkspaceBookingCalculatorTests()
    {
        // Спільний Arrange для тестів
        _calculator = new WorkspaceBookingCalculator();
    }

    #region 1. [Fact] тести: Перевірка винятків, булевих умов, референсів та рядків

    [Fact]
    public void CalculatePrice_NegativeMinutes_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        int invalidMinutes = -30;

        // Act & Assert (Перевірка винятків: Assert.Throws<T>)
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            _calculator.CalculatePrice(invalidMinutes, RoomType.Small, "Guest", 2)
        );

        Assert.Contains("більшою за 0 хвилин", exception.Message);
    }

    [Fact]
    public void IsTimeSlotAvailable_WhenNoOverlap_ReturnsTrue()
    {
        // Arrange
        var existingBookings = new List<(DateTime Start, DateTime End)>
        {
            (new DateTime(2026, 10, 27, 10, 0, 0), new DateTime(2026, 10, 27, 12, 0, 0))
        };
        var newStart = new DateTime(2026, 10, 27, 13, 0, 0);
        var newEnd = new DateTime(2026, 10, 27, 14, 0, 0);

        // Act
        bool isAvailable = _calculator.IsTimeSlotAvailable(newStart, newEnd, existingBookings);

        // Assert (Булеві умови: Assert.True, Assert.False)
        Assert.True(isAvailable);
        Assert.False(!isAvailable);
    }

    [Fact]
    public void GetDiscountDetails_ReferenceAndNullChecks()
    {
        // Arrange & Act
        var nullResult = _calculator.GetDiscountDetails(null);
        var vipFirstCall = _calculator.GetDiscountDetails("VIP");
        var vipSecondCall = _calculator.GetDiscountDetails("VIP");
        var regularCustom = _calculator.GetDiscountDetails("Regular");

        // Assert (Перевірка референсів: Assert.Null, Assert.NotNull, Assert.Same, Assert.NotSame)
        Assert.Null(nullResult);
        Assert.NotNull(vipFirstCall);
        Assert.Same(vipFirstCall, vipSecondCall);       // Посилаються на один статичний екземпляр
        Assert.NotSame(vipFirstCall, regularCustom);    // Різні екземпляри в пам'яті
    }

    [Fact]
    public void GenerateReceiptCode_StringAssertions()
    {
        // Arrange
        string prefix = "lviv";
        int bookingId = 42;

        // Act
        string code = _calculator.GenerateReceiptCode(prefix, bookingId);

        // Assert (Перевірка рядків: Assert.Contains, Assert.StartsWith, Assert.Matches)
        Assert.StartsWith("LVIV", code);
        Assert.Contains("BOOK", code);
        Assert.Matches(@"^[A-Z]+-BOOK-\d{6}$", code); // Формат: ПРЕФІКС-BOOK-000042
    }

    [Fact]
    public void CalculatePrice_RangeChecks()
    {
        // Arrange: 2 години в Small кімнаті (2 * 100 = 200 грн)
        // Act
        decimal price = _calculator.CalculatePrice(120, RoomType.Small, "Guest", 2);

        // Assert (Перевірка діапазонів: Assert.InRange, Assert.NotInRange)
        Assert.InRange(price, 150m, 250m);
        Assert.NotInRange(price, 0m, 100m);
    }

    #endregion

    #region 2. [Theory] з [InlineData]

    [Theory]
    [InlineData(60, RoomType.Small, "Guest", 2, 100.0)]     // 1 год * 100 = 100
    [InlineData(120, RoomType.Medium, "Guest", 3, 300.0)]   // 2 год * 150 = 300
    [InlineData(60, RoomType.Small, "VIP", 2, 80.0)]        // Знижка 20%: 100 * 0.8 = 80
    [InlineData(60, RoomType.Small, "Guest", 8, 300.0)]     // >6 осіб (+200 прибирання): 100 + 200 = 300
    public void CalculatePrice_InlineData_CalculatesExpectedTotal(
        int minutes, RoomType room, string tier, int guests, decimal expectedPrice)
    {
        // Arrange (налаштовано через параметри методу)

        // Act
        decimal actualPrice = _calculator.CalculatePrice(minutes, room, tier, guests);

        // Assert (Перевірка значень: Assert.Equal, Assert.NotEqual)
        Assert.Equal(expectedPrice, actualPrice);
        Assert.NotEqual(0m, actualPrice);
    }

    #endregion

    #region 3. [Theory] з [MemberData]

    public static IEnumerable<object[]> BookingOverlapData =>
        new List<object[]>
        {
            // Слот 10:00 - 12:00
            new object[] { new DateTime(2026, 10, 27, 9, 30, 0), new DateTime(2026, 10, 27, 10, 30, 0), false }, // Перетин на початку
            new object[] { new DateTime(2026, 10, 27, 11, 0, 0), new DateTime(2026, 10, 27, 11, 30, 0), false }, // Повністю всередині
            new object[] { new DateTime(2026, 10, 27, 12, 0, 0), new DateTime(2026, 10, 27, 13, 0, 0), true }    // Стик у стик (вільно)
        };

    [Theory]
    [MemberData(nameof(BookingOverlapData))]
    public void IsTimeSlotAvailable_MemberData_ChecksOverlapCorrectly(
        DateTime start, DateTime end, bool expectedAvailability)
    {
        // Arrange
        var existing = new List<(DateTime Start, DateTime End)>
        {
            (new DateTime(2026, 10, 27, 10, 0, 0), new DateTime(2026, 10, 27, 12, 0, 0))
        };

        // Act
        bool result = _calculator.IsTimeSlotAvailable(start, end, existing);

        // Assert
        Assert.Equal(expectedAvailability, result);
    }

    #endregion

    #region 4. [Theory] з [ClassData]

    [Theory]
    [ClassData(typeof(RoomAllocationTestData))]
    public void DetermineRequiredRoom_ClassData_SelectsCorrectRoom(int guestsCount, RoomType expectedRoom)
    {
        // Arrange & Act
        RoomType actualRoom = _calculator.DetermineRequiredRoom(guestsCount);

        // Assert
        Assert.Equal(expectedRoom, actualRoom);
    }

    #endregion
}