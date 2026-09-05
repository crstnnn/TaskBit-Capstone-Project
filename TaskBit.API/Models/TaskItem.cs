namespace TaskBit.API.Models
{
    // Named TaskItem (not "Task") to avoid clashing with System.Threading.Tasks.Task
    public class TaskItem
    {
        public int TaskId { get; set; }
        public int ProjectId { get; set; }
        public int? SprintId { get; set; }          // null = still in Project Backlog
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int StoryPoints { get; set; }
        public string Priority { get; set; } = "Medium";   // Low, Medium, High, Critical
        public string Status { get; set; } = "ToDo";        // ToDo, InProgress, Review, Done
        public int? AssignedToUserId { get; set; }
        public string? AssignedToName { get; set; }         // populated via JOIN
        public int CreatedByUserId { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
