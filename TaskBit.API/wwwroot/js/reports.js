const Reports = {
  async render(container, ctx) {
    container.innerHTML = `<div class="spinner"></div>`;
    let tasks, sprints;
    try {
      const data = await fetchAllProjectTasks(ctx.project.projectId);
      tasks = data.tasks;
      sprints = data.sprints;
    } catch (err) {
      container.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message)}</div>`;
      return;
    }

    const statusCounts = { ToDo: 0, InProgress: 0, Review: 0, Done: 0 };
    let totalPoints = 0, donePoints = 0;
    tasks.forEach((t) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      totalPoints += t.storyPoints || 0;
      if (t.status === "Done") donePoints += t.storyPoints || 0;
    });
    const sprintCounts = { Planned: 0, Active: 0, Completed: 0 };
    sprints.forEach((s) => (sprintCounts[s.status] = (sprintCounts[s.status] || 0) + 1));

    const bar = (label, value, max, color) => `
      <div class="bar-row">
        <div class="bar-label">${label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${max ? (value / max) * 100 : 0}%;background:${color};"></div></div>
        <div class="bar-value">${value}</div>
      </div>`;
    const maxStatus = Math.max(1, ...Object.values(statusCounts));

    container.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><div class="value">${tasks.length}</div><div class="label">Total work items</div></div>
        <div class="stat-card"><div class="value">${statusCounts.Done}</div><div class="label">Completed</div></div>
        <div class="stat-card"><div class="value">${totalPoints}</div><div class="label">Total story points</div></div>
        <div class="stat-card"><div class="value">${donePoints}</div><div class="label">Story points completed</div></div>
        <div class="stat-card"><div class="value">${sprintCounts.Active || 0}</div><div class="label">Active sprints</div></div>
        <div class="stat-card"><div class="value">${sprintCounts.Completed || 0}</div><div class="label">Completed sprints</div></div>
      </div>

      <h3 style="font-size:14px;margin-bottom:12px;">Work items by status</h3>
      ${bar("To Do", statusCounts.ToDo, maxStatus, "var(--status-todo)")}
      ${bar("In Progress", statusCounts.InProgress, maxStatus, "var(--status-progress)")}
      ${bar("Review", statusCounts.Review, maxStatus, "var(--status-review)")}
      ${bar("Done", statusCounts.Done, maxStatus, "var(--status-done)")}
    `;
  },
};
