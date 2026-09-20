// Shared by List, Calendar and Reports tabs: the API has no "all tasks for a
// project" endpoint, so this aggregates the project backlog with every sprint's tasks.
async function fetchAllProjectTasks(projectId) {
  const sprints = await Api.sprints.getByProject(projectId);
  const [backlogTasks, ...sprintTaskLists] = await Promise.all([
    Api.tasks.getBacklog(projectId),
    ...sprints.map((s) => Api.sprints.getBoard(s.sprintId).catch(() => [])),
  ]);
  const sprintById = new Map(sprints.map((s) => [s.sprintId, s]));
  const tasks = [...backlogTasks, ...sprintTaskLists.flat()];
  return { tasks, sprints, sprintById };
}

const List = {
  async render(container, ctx) {
    container.innerHTML = `<div class="spinner"></div>`;
    let tasks, sprintById;
    try {
      ({ tasks, sprintById } = await fetchAllProjectTasks(ctx.project.projectId));
    } catch (err) {
      container.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message)}</div>`;
      return;
    }

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state tab-empty">
          ${Icon.emptyBacklog}
          <h3>No work items yet</h3>
          <p>Work items you create in the Backlog or Board will show up here.</p>
        </div>`;
      return;
    }

    const statusLabel = { ToDo: "To Do", InProgress: "In Progress", Review: "Review", Done: "Done" };

    container.innerHTML = `
      <table class="list-table">
        <thead>
          <tr><th>Title</th><th>Status</th><th>Priority</th><th>Story points</th><th>Assignee</th><th>Sprint</th><th>Due date</th></tr>
        </thead>
        <tbody>
          ${tasks
            .map(
              (t) => `
            <tr data-task-id="${t.taskId}" style="cursor:pointer;">
              <td>${UI.escapeHtml(t.title)}</td>
              <td><span class="dot dot-${t.status === "ToDo" ? "todo" : t.status === "InProgress" ? "progress" : t.status === "Review" ? "review" : "done"}"></span> ${statusLabel[t.status] || t.status}</td>
              <td><span class="priority-tag priority-${t.priority}">${t.priority}</span></td>
              <td>${t.storyPoints ?? 0}</td>
              <td style="display:flex;align-items:center;gap:6px;">${UI.avatarHtml(t.assignedToName, "sm")} ${UI.escapeHtml(t.assignedToName || "Unassigned")}</td>
              <td>${t.sprintId ? UI.escapeHtml(sprintById.get(t.sprintId)?.sprintName || "") : "Backlog"}</td>
              <td>${t.dueDate ? UI.formatDate(t.dueDate) : "—"}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    const sprintsArr = [...sprintById.values()];
    container.querySelectorAll("tr[data-task-id]").forEach((row) => {
      row.addEventListener("click", () => {
        const task = tasks.find((t) => t.taskId === Number(row.dataset.taskId));
        TaskModal.openDetail({ task, project: ctx.project, session: ctx.session, sprints: sprintsArr, onUpdated: () => this.render(container, ctx) });
      });
    });
  },
};
