const Board = {
  columns: [
    { key: "ToDo", label: "To Do", dot: "dot-todo" },
    { key: "InProgress", label: "In Progress", dot: "dot-progress" },
    { key: "Review", label: "Review", dot: "dot-review" },
    { key: "Done", label: "Done", dot: "dot-done" },
  ],

  async render(container, ctx) {
    container.innerHTML = `<div class="spinner"></div>`;
    let sprints, activeSprint;
    try {
      sprints = await Api.sprints.getByProject(ctx.project.projectId);
      activeSprint = sprints.find((s) => s.status === "Active");
    } catch (err) {
      container.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message)}</div>`;
      return;
    }

    if (!activeSprint) {
      container.innerHTML = `
        <div class="empty-state tab-empty">
          ${Icon.emptyBoard}
          <h3>Get started in the backlog</h3>
          <p>Plan and start a sprint to see work items here.</p>
          <button class="btn btn-primary" id="goToBacklogBtn">Go to Backlog</button>
        </div>`;
      container.querySelector("#goToBacklogBtn").addEventListener("click", () => ctx.switchTab("backlog"));
      return;
    }

    let tasks;
    try {
      tasks = await Api.sprints.getBoard(activeSprint.sprintId);
    } catch (err) {
      container.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message)}</div>`;
      return;
    }

    this.renderBoard(container, ctx, activeSprint, sprints, tasks);
  },

  renderBoard(container, ctx, activeSprint, sprints, tasks) {
    const byStatus = {};
    this.columns.forEach((c) => (byStatus[c.key] = []));
    tasks.forEach((t) => (byStatus[t.status] ??= []).push(t));

    container.innerHTML = `
      <div class="board-toolbar">
        <div>
          <div class="sprint-title">${UI.escapeHtml(activeSprint.sprintName)}</div>
          <div class="sprint-dates">${UI.formatDate(activeSprint.startDate)} – ${UI.formatDate(activeSprint.endDate)}${activeSprint.goal ? " · " + UI.escapeHtml(activeSprint.goal) : ""}</div>
        </div>
        <div class="spacer" style="flex:1;"></div>
        <button class="btn btn-secondary btn-sm" id="boardCreateBtn">${Icon.plus}Create</button>
      </div>
      <div class="board-columns">
        ${this.columns
          .map(
            (c) => `
          <div class="board-column" data-status="${c.key}">
            <div class="board-column-header"><span class="dot ${c.dot}"></span>${c.label} <span class="count">${byStatus[c.key].length}</span></div>
            <div class="column-drop-zone" data-status="${c.key}">
              ${byStatus[c.key].map((t) => this.cardHtml(t)).join("")}
            </div>
          </div>`
          )
          .join("")}
      </div>
    `;

    container.querySelectorAll(".task-card").forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", card.dataset.taskId);
        e.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("click", () => {
        const task = tasks.find((t) => t.taskId === Number(card.dataset.taskId));
        TaskModal.openDetail({
          task,
          project: ctx.project,
          session: ctx.session,
          sprints,
          onUpdated: () => this.render(container, ctx),
        });
      });
    });

    container.querySelector("#boardCreateBtn").addEventListener("click", () => {
      TaskModal.openCreate({
        projectId: ctx.project.projectId,
        sprintId: activeSprint.sprintId,
        onCreated: () => this.render(container, ctx),
      });
    });

    container.querySelectorAll(".board-column").forEach((col) => {
      col.addEventListener("dragover", (e) => {
        e.preventDefault();
        col.classList.add("drag-over");
      });
      col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
      col.addEventListener("drop", async (e) => {
        e.preventDefault();
        col.classList.remove("drag-over");
        const taskId = Number(e.dataTransfer.getData("text/plain"));
        const newStatus = col.dataset.status;
        const task = tasks.find((t) => t.taskId === taskId);
        if (!task || task.status === newStatus) return;
        try {
          await Api.tasks.updateStatus({ taskId, status: newStatus });
          this.render(container, ctx);
        } catch (err) {
          UI.toast(err.message || "Could not update status", "error");
        }
      });
    });
  },

  cardHtml(t) {
    return `
      <div class="task-card" draggable="true" data-task-id="${t.taskId}">
        <div class="title">${UI.escapeHtml(t.title)}</div>
        <div class="meta-row">
          <div class="meta-left">
            <span class="priority-tag priority-${t.priority}">${t.priority}</span>
            ${t.storyPoints ? `<span class="sp-badge">${t.storyPoints} SP</span>` : ""}
          </div>
          ${UI.avatarHtml(t.assignedToName, "sm")}
        </div>
      </div>`;
  },
};
