using Dapper;
using System.Data;
using TaskBit.API.Data;
using TaskBit.API.Models;
using TaskBit.API.Repositories.Interfaces;

namespace TaskBit.API.Repositories
{
    public class TaskRepository : ITaskRepository
    {
        private readonly DapperContext _context;

        public TaskRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<int> CreateAsync(TaskItem task)
        {
            using var connection = _context.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(
                "sp_Tasks_Create",
                new
                {
                    task.ProjectId,
                    task.SprintId,
                    task.Title,
                    task.Description,
                    task.StoryPoints,
                    task.Priority,
                    task.CreatedByUserId,
                    task.DueDate
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<TaskItem?> GetByIdAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<TaskItem>(
                "sp_Tasks_GetById",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure);
        }

        // Project Backlog: tasks not yet pulled into any sprint (SprintId IS NULL)
        public async Task<IEnumerable<TaskItem>> GetByProjectBacklogAsync(int projectId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TaskItem>(
                "sp_Tasks_GetProjectBacklog",
                new { ProjectId = projectId },
                commandType: CommandType.StoredProcedure);
        }

        // Sprint Backlog / board: tasks belonging to a specific sprint
        public async Task<IEnumerable<TaskItem>> GetBySprintAsync(int sprintId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TaskItem>(
                "sp_Tasks_GetBySprint",
                new { SprintId = sprintId },
                commandType: CommandType.StoredProcedure);
        }

        // Backs the Task Load Checker: a member's active (not Done) tasks in a project
        public async Task<IEnumerable<TaskItem>> GetActiveByUserAsync(int userId, int projectId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TaskItem>(
                "sp_Tasks_GetActiveByUser",
                new { UserId = userId, ProjectId = projectId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> AssignAsync(int taskId, int userId)
        {
            using var connection = _context.CreateConnection();
            var rows = await connection.ExecuteAsync(
                "sp_Tasks_Assign",
                new { TaskId = taskId, UserId = userId },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> UpdateStatusAsync(int taskId, string status)
        {
            using var connection = _context.CreateConnection();
            var rows = await connection.ExecuteAsync(
                "sp_Tasks_UpdateStatus",
                new { TaskId = taskId, Status = status },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> MoveToSprintAsync(int taskId, int? sprintId)
        {
            using var connection = _context.CreateConnection();
            var rows = await connection.ExecuteAsync(
                "sp_Tasks_MoveToSprint",
                new { TaskId = taskId, SprintId = sprintId },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }
    }
}
