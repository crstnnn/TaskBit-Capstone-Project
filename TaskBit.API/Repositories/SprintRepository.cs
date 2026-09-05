using Dapper;
using System.Data;
using TaskBit.API.Data;
using TaskBit.API.Models;
using TaskBit.API.Repositories.Interfaces;

namespace TaskBit.API.Repositories
{
    public class SprintRepository : ISprintRepository
    {
        private readonly DapperContext _context;

        public SprintRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<int> CreateAsync(Sprint sprint)
        {
            using var connection = _context.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(
                "sp_Sprints_Create",
                new { sprint.ProjectId, sprint.SprintName, sprint.Goal, sprint.StartDate, sprint.EndDate },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<Sprint?> GetByIdAsync(int sprintId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Sprint>(
                "sp_Sprints_GetById",
                new { SprintId = sprintId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<Sprint>> GetByProjectAsync(int projectId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Sprint>(
                "sp_Sprints_GetByProject",
                new { ProjectId = projectId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateStatusAsync(int sprintId, string status)
        {
            using var connection = _context.CreateConnection();
            var rows = await connection.ExecuteAsync(
                "sp_Sprints_UpdateStatus",
                new { SprintId = sprintId, Status = status },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }
    }
}
