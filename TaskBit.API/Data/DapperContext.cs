using Microsoft.Data.SqlClient;
using System.Data;

namespace TaskBit.API.Data
{
    // Single source of DB connections for every repository.
    // Registered as a Singleton in Program.cs.
    public class DapperContext
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public DapperContext(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("TaskBitDB")
                ?? throw new InvalidOperationException("Connection string 'TaskBitDB' not found in appsettings.json");
        }

        // A new connection per call — Dapper opens/closes it for you when you
        // pass it to QueryAsync/ExecuteAsync (or you can open it explicitly).
        public IDbConnection CreateConnection()
            => new SqlConnection(_connectionString);
    }
}
