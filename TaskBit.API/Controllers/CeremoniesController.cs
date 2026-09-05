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
    public class CeremoniesController : ControllerBase
    {
        private readonly ICeremonyRepository _ceremonyRepository;

        public CeremoniesController(ICeremonyRepository ceremonyRepository)
        {
            _ceremonyRepository = ceremonyRepository;
        }

        // ---- Daily Scrum ----

        // POST api/ceremonies/standups
        [HttpPost("standups")]
        public async Task<IActionResult> CreateStandup(CreateStandupDto dto)
        {
            var standup = new DailyStandup
            {
                SprintId = dto.SprintId,
                UserId = dto.UserId,
                StandupDate = dto.StandupDate,
                YesterdayWork = dto.YesterdayWork,
                TodayPlan = dto.TodayPlan,
                Blockers = dto.Blockers
            };
            var newId = await _ceremonyRepository.CreateStandupAsync(standup);
            return Ok(new { standupId = newId });
        }

        // GET api/ceremonies/standups/sprint/5
        [HttpGet("standups/sprint/{sprintId:int}")]
        public async Task<IActionResult> GetStandups(int sprintId)
        {
            var standups = await _ceremonyRepository.GetStandupsBySprintAsync(sprintId);
            return Ok(standups);
        }

        // ---- Sprint Review ----

        // POST api/ceremonies/reviews
        [HttpPost("reviews")]
        public async Task<IActionResult> CreateReview(CreateSprintReviewDto dto)
        {
            var review = new SprintReview
            {
                SprintId = dto.SprintId,
                ReviewDate = dto.ReviewDate,
                CompletedWorkSummary = dto.CompletedWorkSummary,
                Feedback = dto.Feedback,
                ConductedByUserId = dto.ConductedByUserId
            };
            var newId = await _ceremonyRepository.CreateSprintReviewAsync(review);
            return Ok(new { sprintReviewId = newId });
        }

        // ---- Sprint Retrospective ----

        // POST api/ceremonies/retrospectives
        [HttpPost("retrospectives")]
        public async Task<IActionResult> CreateRetrospective(CreateRetrospectiveDto dto)
        {
            var retro = new SprintRetrospective
            {
                SprintId = dto.SprintId,
                RetroDate = dto.RetroDate,
                WhatWentWell = dto.WhatWentWell,
                WhatToImprove = dto.WhatToImprove,
                ActionItems = dto.ActionItems,
                ConductedByUserId = dto.ConductedByUserId
            };
            var newId = await _ceremonyRepository.CreateRetrospectiveAsync(retro);
            return Ok(new { retroId = newId });
        }
    }
}
