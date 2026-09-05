namespace TaskBit.API.DTOs
{
    // ---------- Auth ----------
    public class RegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int RoleId { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
    }

    // ---------- Tasks ----------
    public class CreateTaskDto
    {
        public int ProjectId { get; set; }
        public int? SprintId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int StoryPoints { get; set; }
        public string Priority { get; set; } = "Medium";
        public DateTime? DueDate { get; set; }
    }

    public class AssignTaskDto
    {
        public int TaskId { get; set; }
        public int AssignedToUserId { get; set; }
    }

    public class UpdateTaskStatusDto
    {
        public int TaskId { get; set; }
        public string Status { get; set; } = string.Empty; // ToDo, InProgress, Review, Done
    }

    // Result returned by the Task Load Checker before an assignment is confirmed
    public class TaskLoadResultDto
    {
        public int UserId { get; set; }
        public bool CanAssign { get; set; }
        public int CurrentActiveTasks { get; set; }
        public int MaxActiveTasks { get; set; }
        public int CurrentStoryPoints { get; set; }
        public int MaxStoryPoints { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    // ---------- Sprints ----------
    public class CreateSprintDto
    {
        public int ProjectId { get; set; }
        public string SprintName { get; set; } = string.Empty;
        public string? Goal { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    // ---------- Ceremonies ----------
    public class CreateStandupDto
    {
        public int SprintId { get; set; }
        public int UserId { get; set; }
        public DateTime StandupDate { get; set; }
        public string? YesterdayWork { get; set; }
        public string? TodayPlan { get; set; }
        public string? Blockers { get; set; }
    }

    public class CreateSprintReviewDto
    {
        public int SprintId { get; set; }
        public DateTime ReviewDate { get; set; }
        public string? CompletedWorkSummary { get; set; }
        public string? Feedback { get; set; }
        public int ConductedByUserId { get; set; }
    }

    public class CreateRetrospectiveDto
    {
        public int SprintId { get; set; }
        public DateTime RetroDate { get; set; }
        public string? WhatWentWell { get; set; }
        public string? WhatToImprove { get; set; }
        public string? ActionItems { get; set; }
        public int ConductedByUserId { get; set; }
    }
}
