using AutoMapper;
using MyTodoApi.DTO;
using MyTodoApi.Models;

namespace MyTodoApi.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ------------------ Resident ------------------
        CreateMap<Resident, ResidentDTO>().ReverseMap();
        
        CreateMap<ResidentDTO, Resident>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // ------------------ Workspace ------------------
        CreateMap<Workspace, WorkspaceDTO>().ReverseMap();
        
        CreateMap<UpdateWorkspaceDTO, Workspace>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // ------------------ Booking ------------------
        CreateMap<Booking, BookingDTO>().ReverseMap();
        
        // Мапінг для PATCH: оновлюємо тільки ті поля, які не є null
        CreateMap<UpdateBookingDTO, Booking>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}