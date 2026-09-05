using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskBit.API.Models;
using TaskBit.API.Repositories.Interfaces;

namespace TaskBit.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectRepository _projectRepository;

        public ProjectsController(IProjectRepository projectRepository)
        {
            _projectRepository = projectRepository;
        }

        // GET api/projects/user/5
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetForUser(int userId)
        {
            var projects = await _projectRepository.GetAllForUserAsync(userId);
            return Ok(projects);
        }

        // GET api/projects/5
        [HttpGet("{projectId:int}")]
        public async Task<IActionResult> GetById(int projectId)
        {
            var project = await _projectRepository.GetByIdAsync(projectId);
            if (project == null) return NotFound();
            return Ok(project);
        }

        // POST api/projects
        [HttpPost]
        public async Task<IActionResult> Create(Project project)
        {
            var newId = await _projectRepository.CreateAsync(project);
            return CreatedAtAction(nameof(GetById), new { projectId = newId }, new { projectId = newId });
        }

        // POST api/projects/members
        [HttpPost("members")]
        public async Task<IActionResult> AddMember(ProjectMember member)
        {
            var success = await _projectRepository.AddMemberAsync(member);
            if (!success) return BadRequest();
            return Ok();
        }

        // PUT api/projects/workload-limit
        [HttpPut("workload-limit")]
        public async Task<IActionResult> SetWorkloadLimit(WorkloadLimit limit)
        {
            var success = await _projectRepository.SetWorkloadLimitAsync(limit);
            if (!success) return NotFound();
            return Ok();
        }
    }
}
