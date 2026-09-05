using Dapper;
using System.Data;
using TaskBit.API.Data;
using TaskBit.API.Models;
using TaskBit.API.Repositories.Interfaces;

namespace TaskBit.API.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly DapperContext _context;

        public UserRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<User>(
                "sp_Users_GetByEmail",
                new { Email = email },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<User?> GetByIdAsync(int userId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<User>(
                "sp_Users_GetById",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CreateAsync(User user)
        {
            using var connection = _context.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(
                "sp_Users_Create",
                new { user.FullName, user.Email, user.PasswordHash, user.RoleId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<User>> GetByProjectAsync(int projectId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<User>(
                "sp_Users_GetByProject",
                new { ProjectId = projectId },
                commandType: CommandType.StoredProcedure);
        }
    }
}
