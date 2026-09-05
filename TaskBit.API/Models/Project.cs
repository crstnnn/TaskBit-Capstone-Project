namespace TaskBit.API.Models
{
    public class Project
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CreatedByUserId { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
    }

    public class ProjectMember
    {
        public int ProjectMemberId { get; set; }
        public int ProjectId { get; set; }
        public int UserId { get; set; }
        public string? FullName { get; set; }   // populated via JOIN
        public string ProjectRole { get; set; } = "Member"; // TeamLead, Member
        public DateTime JoinedAt { get; set; }
    }

    public class WorkloadLimit
    {
        public int WorkloadLimitId { get; set; }
        public int ProjectId { get; set; }
        public int MaxActiveTasks { get; set; } = 5;
        public int MaxStoryPoints { get; set; } = 20;
    }
}
