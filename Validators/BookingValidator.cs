namespace MyTodoApi.Models;
using FluentValidation;
using MyTodoApi.DTO;

public class CreateBookingValidator : AbstractValidator<CreateBookingDTO>
{
    public CreateBookingValidator()
    {
        RuleFor(x => x.WorkspaceId)
            .GreaterThan(0).WithMessage("Ідентифікатор робочої зони обов'язковий.");

        RuleFor(x => x.ResidentName)
            .NotEmpty().WithMessage("Ім'я резидента обов'язкове.");

        RuleFor(x => x.ResidentSurName)
            .NotEmpty().WithMessage("Прізвище резидента обов'язкове.");

        RuleFor(x => x.BookingDate)
            .GreaterThan(DateTime.Now).WithMessage("Час початку має бути в майбутньому.");

        RuleFor(x => x.DurationMinutes)
            .GreaterThanOrEqualTo(60).WithMessage("Тривалість має бути не менше 1 години (60 хвилин).")
            .Must(m => m % 30 == 0).WithMessage("Тривалість має бути кратна 30 хвилинам.");

        RuleFor(x => x.ResidentCount)
            .GreaterThan(0).WithMessage("Кількість учасників повинна бути більше 0.");
    }
}