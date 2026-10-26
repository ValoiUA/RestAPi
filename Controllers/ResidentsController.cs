using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using MyTodoApi.DTO;
using MyTodoApi.Models;
using MyTodoApi.Repositories;

namespace MyTodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Tags("3. Residents")]
public class ResidentsController : ControllerBase
{
    private readonly IResidentRepository _residentRepository;
    private readonly IValidator<ResidentDTO> _validator;

    public ResidentsController(IResidentRepository residentRepository, IValidator<ResidentDTO> validator)
    {
        _residentRepository = residentRepository;
        _validator = validator;
    }

    [HttpGet]
    [EndpointSummary("Отримати всіх резидентів")]
    public async Task<IActionResult> GetAll()
    {
        var residents = await _residentRepository.GetAllAsync();
        return Ok(residents);
    }

    [HttpGet("{id}")]
    [EndpointSummary("Отримати резидента за ID")]
    public async Task<IActionResult> GetById(string id)
    {
        var resident = await _residentRepository.GetByIdAsync(id);
        if (resident is null)
        {
            return NotFound(new { Message = $"Резидента з ID {id} не знайдено." });
        }
        return Ok(resident);
    }

    [HttpPost]
    [EndpointSummary("Додати нового резидента")]
    public async Task<IActionResult> Create([FromBody] ResidentDTO newResidentDto)
    {
        var result = await _validator.ValidateAsync(newResidentDto);
        if (!result.IsValid)
        {
            return BadRequest(result.Errors.Select(e => e.ErrorMessage));
        }

        var resident = new Resident
        {
            Name = newResidentDto.Name,
            SurName = newResidentDto.SurName,
            Type = newResidentDto.Type
        };

        await _residentRepository.CreateAsync(resident);
        return CreatedAtAction(nameof(GetById), new { id = resident.Id }, resident);
    }

    [HttpDelete("{id}")]
    [EndpointSummary("Видалити резидента")]
    public async Task<IActionResult> Delete(string id)
    {
        var isDeleted = await _residentRepository.DeleteAsync(id);
        if (!isDeleted)
        {
            return NotFound(new { Message = $"Резидента з ID {id} не знайдено." });
        }
        return Ok(new { Status = "Deleted", Id = id });
    }

    [HttpPut("{id}")]
    [EndpointSummary("Повністю оновити резидента")]
    public async Task<IActionResult> Put(string id, [FromBody] ResidentDTO updateDTO)
    {
        var result = await _validator.ValidateAsync(updateDTO);
        if (!result.IsValid)
        {
            return BadRequest(result.Errors.Select(e => e.ErrorMessage));
        }

        var existingResident = await _residentRepository.GetByIdAsync(id);
        if (existingResident is null)
        {
            return NotFound(new { Message = $"Резидента з ID {id} не знайдено." });
        }

        existingResident.Name = updateDTO.Name;
        existingResident.SurName = updateDTO.SurName;
        existingResident.Type = updateDTO.Type;

        var isUpdated = await _residentRepository.UpdateAsync(id, existingResident);
        return isUpdated ? Ok(existingResident) : StatusCode(500, "Помилка оновлення даних.");
    }

    [HttpPatch("{id}")]
    [EndpointSummary("Частково оновити резидента")]
    public async Task<IActionResult> Patch(string id, [FromBody] ResidentDTO updateDTO)
    {
        var existingResident = await _residentRepository.GetByIdAsync(id);
        if (existingResident is null)
        {
            return NotFound(new { Message = $"Резидента з ID {id} не знайдено." });
        }

        if (!string.IsNullOrWhiteSpace(updateDTO.Name)) 
            existingResident.Name = updateDTO.Name;

        if (!string.IsNullOrWhiteSpace(updateDTO.SurName)) 
            existingResident.SurName = updateDTO.SurName;

        if (updateDTO.Type.HasValue) 
            existingResident.Type = updateDTO.Type.Value;

        var isUpdated = await _residentRepository.UpdateAsync(id, existingResident);
        return isUpdated ? Ok(existingResident) : StatusCode(500, "Помилка оновлення даних.");
    }
}