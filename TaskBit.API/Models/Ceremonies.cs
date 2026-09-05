namespace TaskBit.API.Models
{
    public class DailyStandup
    {
        public int StandupId { get; set; }
        public int SprintId { get; set; }
        public int UserId { get; set; }
        public string? FullName { get; set; }
        public DateTime StandupDate { get; set; }
        public string? YesterdayWork { get; set; }
        public string? TodayPlan { get; set; }
        public string? Blockers { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SprintReview
    {
        public int SprintReviewId { get; set; }
        public int SprintId { get; set; }
        public DateTime ReviewDate { get; set; }
        public string? CompletedWorkSummary { get; set; }
        public string? Feedback { get; set; }
        public int ConductedByUserId { get; set; }
    }

    public class SprintRetrospective
    {
        public int RetroId { get; set; }
        public int SprintId { get; set; }
        public DateTime RetroDate { get; set; }
        public string? WhatWentWell { get; set; }
        public string? WhatToImprove { get; set; }
        public string? ActionItems { get; set; }
        public int ConductedByUserId { get; set; }
    }

    public class TaskComment
    {
        public int CommentId { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string? FullName { get; set; }
        public string CommentText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
