using TaskBit.API.DTOs;
using TaskBit.API.Repositories.Interfaces;

namespace TaskBit.API.Services
{
    public interface ITaskLoadCheckerService
    {
        // Evaluates whether a user can take on ONE more task (with the given
        // story points) without breaching the project's workload limits.
        Task<TaskLoadResultDto> CheckWorkloadAsync(int userId, int projectId, int incomingStoryPoints);
    }

    public class TaskLoadCheckerService : ITaskLoadCheckerService
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IProjectRepository _projectRepository;

        public TaskLoadCheckerService(ITaskRepository taskRepository, IProjectRepository projectRepository)
        {
            _taskRepository = taskRepository;
            _projectRepository = projectRepository;
        }

        public async Task<TaskLoadResultDto> CheckWorkloadAsync(int userId, int projectId, int incomingStoryPoints)
        {
            var limit = await _projectRepository.GetWorkloadLimitAsync(projectId);
            // fall back to sensible defaults if a project hasn't set one explicitly
            var maxActiveTasks = limit?.MaxActiveTasks ?? 5;
            var maxStoryPoints = limit?.MaxStoryPoints ?? 20;

            var activeTasks = (await _taskRepository.GetActiveByUserAsync(userId, projectId)).ToList();

            var currentActiveTaskCount = activeTasks.Count;
            var currentStoryPointTotal = activeTasks.Sum(t => t.StoryPoints);

            var wouldExceedTaskCount = currentActiveTaskCount + 1 > maxActiveTasks;
            var wouldExceedStoryPoints = currentStoryPointTotal + incomingStoryPoints > maxStoryPoints;

            var canAssign = !wouldExceedTaskCount && !wouldExceedStoryPoints;

            string message;
            if (canAssign)
            {
                message = "Within workload capacity.";
            }
            else if (wouldExceedTaskCount && wouldExceedStoryPoints)
            {
                message = $"Assigning this task would exceed both the active task limit ({maxActiveTasks}) and the story point limit ({maxStoryPoints}) for this member.";
            }
            else if (wouldExceedTaskCount)
            {
                message = $"Member already has {currentActiveTaskCount} active task(s); the limit is {maxActiveTasks}.";
            }
            else
            {
                message = $"Member's story point load would reach {currentStoryPointTotal + incomingStoryPoints}, exceeding the limit of {maxStoryPoints}.";
            }

            return new TaskLoadResultDto
            {
                UserId = userId,
                CanAssign = canAssign,
                CurrentActiveTasks = currentActiveTaskCount,
                MaxActiveTasks = maxActiveTasks,
                CurrentStoryPoints = currentStoryPointTotal,
                MaxStoryPoints = maxStoryPoints,
                Message = message
            };
        }
    }
}
