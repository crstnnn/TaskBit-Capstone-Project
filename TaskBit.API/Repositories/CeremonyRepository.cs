using Dapper;
using System.Data;
using TaskBit.API.Data;
using TaskBit.API.Models;
using TaskBit.API.Repositories.Interfaces;

namespace TaskBit.API.Repositories
{
    public class CeremonyRepository : ICeremonyRepository
    {
        private readonly DapperContext _context;

        public CeremonyRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<int> CreateStandupAsync(DailyStandup standup)
        {
            using var connection = _context.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(
                "sp_Standups_Create",
                new
                {
                    standup.SprintId,
                    standup.UserId,
                    standup.StandupDate,
                    standup.YesterdayWork,
                    standup.TodayPlan,
                    standup.Blockers
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<DailyStandup>> GetStandupsBySprintAsync(int sprintId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<DailyStandup>(
                "sp_Standups_GetBySprint",
                new { SprintId = sprintId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CreateSprintReviewAsync(SprintReview review)
        {
            using var connection = _context.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(
                "sp_SprintReviews_Create",
                new
                {
                    review.SprintId,
                    review.ReviewDate,
                    review.CompletedWorkSummary,
                    review.Feedback,
                    review.ConductedByUserId
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CreateRetrospectiveAsync(SprintRetrospective retro)
        {
            using var connection = _context.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(
                "sp_Retrospectives_Create",
                new
                {
                    retro.SprintId,
                    retro.RetroDate,
                    retro.WhatWentWell,
                    retro.WhatToImprove,
                    retro.ActionItems,
                    retro.ConductedByUserId
                },
                commandType: CommandType.StoredProcedure);
        }
    }
}
