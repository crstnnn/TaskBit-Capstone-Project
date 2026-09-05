using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskBit.API.DTOs;
using TaskBit.API.Models;
using TaskBit.API.Repositories.Interfaces;
using TaskBit.API.Services;

namespace TaskBit.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ITaskRepository _taskRepository;
        private readonly ITaskLoadCheckerService _taskLoadChecker;

        public TasksController(ITaskRepository taskRepository, ITaskLoadCheckerService taskLoadChecker)
        {
            _taskRepository = taskRepository;
            _taskLoadChecker = taskLoadChecker;
        }

        // GET api/tasks/5
        [HttpGet("{taskId:int}")]
        public async Task<IActionResult> GetById(int taskId)
        {
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null) return NotFound();
            return Ok(task);
        }

        // GET api/tasks/backlog/5  -> Project Backlog (tasks not yet in a sprint)
        [HttpGet("backlog/{projectId:int}")]
        public async Task<IActionResult> GetBacklog(int projectId)
        {
            var tasks = await _taskRepository.GetByProjectBacklogAsync(projectId);
            return Ok(tasks);
        }

        // POST api/tasks  -> create a task (goes to Project Backlog unless SprintId is set)
        [HttpPost]
        public async Task<IActionResult> Create(CreateTaskDto dto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

            var task = new TaskItem
            {
                ProjectId = dto.ProjectId,
                SprintId = dto.SprintId,
                Title = dto.Title,
                Description = dto.Description,
                StoryPoints = dto.StoryPoints,
                Priority = dto.Priority,
                DueDate = dto.DueDate,
                CreatedByUserId = userId
            };

            var newId = await _taskRepository.CreateAsync(task);
            return CreatedAtAction(nameof(GetById), new { taskId = newId }, new { taskId = newId });
        }

        // GET api/tasks/load-check?userId=3&projectId=1&storyPoints=5
        // Lets the UI ask "can I assign this?" BEFORE actually assigning it.
        [HttpGet("load-check")]
        public async Task<IActionResult> CheckLoad([FromQuery] int userId, [FromQuery] int projectId, [FromQuery] int storyPoints)
        {
            var result = await _taskLoadChecker.CheckWorkloadAsync(userId, projectId, storyPoints);
            return Ok(result);
        }

        // POST api/tasks/assign
        // Runs the Task Load Checker first; only assigns if it passes,
        // unless the caller explicitly overrides (e.g. a TeamLead override).
        [HttpPost("assign")]
        public async Task<IActionResult> Assign(AssignTaskDto dto, [FromQuery] bool overrideLimit = false)
        {
            var task = await _taskRepository.GetByIdAsync(dto.TaskId);
            if (task == null) return NotFound(new { message = "Task not found." });

            var loadResult = await _taskLoadChecker.CheckWorkloadAsync(dto.AssignedToUserId, task.ProjectId, task.StoryPoints);

            if (!loadResult.CanAssign && !overrideLimit)
            {
                return BadRequest(new
                {
                    message = "Assignment blocked by Task Load Checker.",
                    loadResult
                });
            }

            var success = await _taskRepository.AssignAsync(dto.TaskId, dto.AssignedToUserId);
            if (!success) return BadRequest();

            return Ok(new { message = "Task assigned.", loadResult });
        }

        // PUT api/tasks/status
        [HttpPut("status")]
        public async Task<IActionResult> UpdateStatus(UpdateTaskStatusDto dto)
        {
            var success = await _taskRepository.UpdateStatusAsync(dto.TaskId, dto.Status);
            if (!success) return NotFound();
            return Ok();
        }

        // PUT api/tasks/5/move-to-sprint/3   (pass 0 to send back to backlog)
        [HttpPut("{taskId:int}/move-to-sprint/{sprintId:int}")]
        public async Task<IActionResult> MoveToSprint(int taskId, int sprintId)
        {
            int? target = sprintId == 0 ? null : sprintId;
            var success = await _taskRepository.MoveToSprintAsync(taskId, target);
            if (!success) return NotFound();
            return Ok();
        }
    }
}
