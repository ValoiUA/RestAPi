using System.Collections;
using CoworkingApp.Services;

namespace CoworkingApp.Tests.Tests;

public class RoomAllocationTestData : IEnumerable<object[]>
{
    public IEnumerator<object[]> GetEnumerator()
    {
        yield return new object[] { 3, RoomType.Small };
        yield return new object[] { 6, RoomType.Medium };
        yield return new object[] { 10, RoomType.Big };
        yield return new object[] { 14, RoomType.Large };
    }

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}