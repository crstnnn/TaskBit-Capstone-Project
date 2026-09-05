using TaskBit.API.Models;

namespace TaskBit.API.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(int userId);
        Task<int> CreateAsync(User user);
        Task<IEnumerable<User>> GetByProjectAsync(int projectId);
    }

    public interface IProjectRepository
    {
        Task<int> CreateAsync(Project project);
        Task<Project?> GetByIdAsync(int projectId);
        Task<IEnumerable<Project>> GetAllForUserAsync(int userId);
        Task<bool> AddMemberAsync(ProjectMember member);
        Task<WorkloadLimit?> GetWorkloadLimitAsync(int projectId);
        Task<bool> SetWorkloadLimitAsync(WorkloadLimit limit);
    }

    public interface ISprintRepository
    {
        Task<int> CreateAsync(Sprint sprint);
        Task<Sprint?> GetByIdAsync(int sprintId);
        Task<IEnumerable<Sprint>> GetByProjectAsync(int projectId);
        Task<bool> UpdateStatusAsync(int sprintId, string status);
    }

    public interface ITaskRepository
    {
        Task<int> CreateAsync(TaskItem task);
        Task<TaskItem?> GetByIdAsync(int taskId);
        Task<IEnumerable<TaskItem>> GetByProjectBacklogAsync(int projectId);   // SprintId IS NULL
        Task<IEnumerable<TaskItem>> GetBySprintAsync(int sprintId);
        Task<IEnumerable<TaskItem>> GetActiveByUserAsync(int userId, int projectId); // for Task Load Checker
        Task<bool> AssignAsync(int taskId, int userId);
        Task<bool> UpdateStatusAsync(int taskId, string status);
        Task<bool> MoveToSprintAsync(int taskId, int? sprintId);
    }

    public interface ICeremonyRepository
    {
        Task<int> CreateStandupAsync(DailyStandup standup);
        Task<IEnumerable<DailyStandup>> GetStandupsBySprintAsync(int sprintId);
        Task<int> CreateSprintReviewAsync(SprintReview review);
        Task<int> CreateRetrospectiveAsync(SprintRetrospective retro);
    }
}
