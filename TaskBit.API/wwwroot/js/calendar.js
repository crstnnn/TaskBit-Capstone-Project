const Calendar = {
  viewDate: new Date(),

  async render(container, ctx) {
    container.innerHTML = `<div class="spinner"></div>`;
    let tasks, sprintsArr;
    try {
      const data = await fetchAllProjectTasks(ctx.project.projectId);
      tasks = data.tasks.filter((t) => t.dueDate);
      sprintsArr = [...data.sprintById.values()];
    } catch (err) {
      container.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message)}</div>`;
      return;
    }
    this.renderMonth(container, ctx, tasks, sprintsArr);
  },

  renderMonth(container, ctx, tasks, sprintsArr) {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const monthLabel = this.viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    const today = new Date();
    const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const tasksByDateKey = new Map();
    tasks.forEach((t) => {
      const d = new Date(t.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!tasksByDateKey.has(key)) tasksByDateKey.set(key, []);
      tasksByDateKey.get(key).push(t);
    });

    let cellsHtml = "";
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const outside = cellDate.getMonth() !== month;
      const key = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
      const dayTasks = tasksByDateKey.get(key) || [];
      cellsHtml += `
        <div class="calendar-cell ${outside ? "outside" : ""} ${isSameDay(cellDate, today) ? "today" : ""}">
          <div class="cell-date">${cellDate.getDate()}</div>
          ${dayTasks.slice(0, 3).map((t) => `<div class="calendar-chip" data-task-id="${t.taskId}" title="${UI.escapeHtml(t.title)}">${UI.escapeHtml(t.title)}</div>`).join("")}
          ${dayTasks.length > 3 ? `<div class="calendar-chip">+${dayTasks.length - 3} more</div>` : ""}
        </div>`;
    }

    container.innerHTML = `
      <div class="calendar-header">
        <button class="btn-icon" id="calPrevBtn">${Icon.chevronLeft}</button>
        <h3>${monthLabel}</h3>
        <button class="btn-icon" id="calNextBtn">${Icon.chevronRight}</button>
        <button class="btn btn-secondary btn-sm" id="calTodayBtn">Today</button>
      </div>
      <div class="calendar-grid">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<div class="calendar-dow">${d}</div>`).join("")}
        ${cellsHtml}
      </div>
    `;

    container.querySelector("#calPrevBtn").addEventListener("click", () => {
      this.viewDate = new Date(year, month - 1, 1);
      this.renderMonth(container, ctx, tasks, sprintsArr);
    });
    container.querySelector("#calNextBtn").addEventListener("click", () => {
      this.viewDate = new Date(year, month + 1, 1);
      this.renderMonth(container, ctx, tasks, sprintsArr);
    });
    container.querySelector("#calTodayBtn").addEventListener("click", () => {
      this.viewDate = new Date();
      this.renderMonth(container, ctx, tasks, sprintsArr);
    });
    container.querySelectorAll("[data-task-id]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const task = tasks.find((t) => t.taskId === Number(chip.dataset.taskId));
        if (task) TaskModal.openDetail({ task, project: ctx.project, session: ctx.session, sprints: sprintsArr, onUpdated: () => this.render(container, ctx) });
      });
    });
  },
};
