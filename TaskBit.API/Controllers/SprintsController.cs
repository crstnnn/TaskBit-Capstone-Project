using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskBit.API.DTOs;
using TaskBit.API.Models;
using TaskBit.API.Repositories.Interfaces;

namespace TaskBit.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SprintsController : ControllerBase
    {
        private readonly ISprintRepository _sprintRepository;
        private readonly ITaskRepository _taskRepository;

        public SprintsController(ISprintRepository sprintRepository, ITaskRepository taskRepository)
        {
            _sprintRepository = sprintRepository;
            _taskRepository = taskRepository;
        }

        // GET api/sprints/project/5
        [HttpGet("project/{projectId:int}")]
        public async Task<IActionResult> GetByProject(int projectId)
        {
            var sprints = await _sprintRepository.GetByProjectAsync(projectId);
            return Ok(sprints);
        }

        // GET api/sprints/5
        [HttpGet("{sprintId:int}")]
        public async Task<IActionResult> GetById(int sprintId)
        {
            var sprint = await _sprintRepository.GetByIdAsync(sprintId);
            if (sprint == null) return NotFound();
            return Ok(sprint);
        }

        // GET api/sprints/5/board  -> the Sprint Backlog / Kanban board for this sprint
        [HttpGet("{sprintId:int}/board")]
        public async Task<IActionResult> GetBoard(int sprintId)
        {
            var tasks = await _taskRepository.GetBySprintAsync(sprintId);
            return Ok(tasks);
        }

        // POST api/sprints
        [HttpPost]
        public async Task<IActionResult> Create(CreateSprintDto dto)
        {
            var sprint = new Sprint
            {
                ProjectId = dto.ProjectId,
                SprintName = dto.SprintName,
                Goal = dto.Goal,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate
            };

            var newId = await _sprintRepository.CreateAsync(sprint);
            return CreatedAtAction(nameof(GetById), new { sprintId = newId }, new { sprintId = newId });
        }

        // PUT api/sprints/5/status
        [HttpPut("{sprintId:int}/status")]
        public async Task<IActionResult> UpdateStatus(int sprintId, [FromBody] string status)
        {
            var success = await _sprintRepository.UpdateStatusAsync(sprintId, status);
            if (!success) return NotFound();
            return Ok();
        }
    }
}
