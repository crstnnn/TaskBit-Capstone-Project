namespace TaskBit.API.Models
{
    public class Sprint
    {
        public int SprintId { get; set; }
        public int ProjectId { get; set; }
        public string SprintName { get; set; } = string.Empty;
        public string? Goal { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Planned"; // Planned, Active, Completed
        public DateTime CreatedAt { get; set; }
    }
}
