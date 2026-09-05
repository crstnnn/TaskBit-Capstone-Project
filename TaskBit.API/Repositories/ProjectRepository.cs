using Dapper;
using System.Data;
using TaskBit.API.Data;
using TaskBit.API.Models;
using TaskBit.API.Repositories.Interfaces;

namespace TaskBit.API.Repositories
{
    public class ProjectRepository : IProjectRepository
    {
        private readonly DapperContext _context;

        public ProjectRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<int> CreateAsync(Project project)
        {
            using var connection = _context.CreateConnection();
            // sp_Projects_Create also inserts the TeamLead membership row
            // and the default WorkloadLimits row for the new project.
            return await connection.ExecuteScalarAsync<int>(
                "sp_Projects_Create",
                new { project.ProjectName, project.Description, project.CreatedByUserId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<Project?> GetByIdAsync(int projectId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Project>(
                "sp_Projects_GetById",
                new { ProjectId = projectId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<Project>> GetAllForUserAsync(int userId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Project>(
                "sp_Projects_GetAllForUser",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> AddMemberAsync(ProjectMember member)
        {
            using var connection = _context.CreateConnection();
            var rows = await connection.ExecuteAsync(
                "sp_ProjectMembers_Add",
                new { member.ProjectId, member.UserId, member.ProjectRole },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<WorkloadLimit?> GetWorkloadLimitAsync(int projectId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<WorkloadLimit>(
                "sp_WorkloadLimits_Get",
                new { ProjectId = projectId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> SetWorkloadLimitAsync(WorkloadLimit limit)
        {
            using var connection = _context.CreateConnection();
            var rows = await connection.ExecuteAsync(
                "sp_WorkloadLimits_Set",
                new { limit.ProjectId, limit.MaxActiveTasks, limit.MaxStoryPoints },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }
    }
}
