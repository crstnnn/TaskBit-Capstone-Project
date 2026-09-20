const Backlog = {
  collapsedIds: new Set(),
  quickAddOpenFor: null,

  async render(container, ctx) {
    container.innerHTML = `<div class="spinner"></div>`;
    let sprints, backlogTasks;
    try {
      [sprints, backlogTasks] = await Promise.all([
        Api.sprints.getByProject(ctx.project.projectId),
        Api.tasks.getBacklog(ctx.project.projectId),
      ]);
    } catch (err) {
      container.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message)}</div>`;
      return;
    }

    const statusRank = { Active: 0, Planned: 1, Completed: 2 };
    sprints = [...sprints].sort((a, b) => (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3));

    const sprintTaskLists = await Promise.all(sprints.map((s) => Api.sprints.getBoard(s.sprintId).catch(() => [])));

    container.innerHTML = `
      <div class="page-header" style="margin-bottom:14px;">
        <div></div>
        <button class="btn btn-secondary" id="createSprintBtn">${Icon.plus}Create sprint</button>
      </div>
      <div id="backlogSections"></div>
    `;
    const sectionsEl = container.querySelector("#backlogSections");

    sprints.forEach((sprint, i) => {
      sectionsEl.insertAdjacentHTML("beforeend", this.sprintSectionHtml(sprint, sprintTaskLists[i]));
    });
    sectionsEl.insertAdjacentHTML("beforeend", this.backlogSectionHtml(backlogTasks));

    this.wireInteractions(container, ctx, sprints, sprintTaskLists, backlogTasks);
    container.querySelector("#createSprintBtn").addEventListener("click", () => this.openCreateSprintModal(container, ctx));
  },

  countPills(tasks) {
    const todo = tasks.filter((t) => t.status === "ToDo").length;
    const progress = tasks.filter((t) => t.status === "InProgress" || t.status === "Review").length;
    const done = tasks.filter((t) => t.status === "Done").length;
    return `
      <div class="status-pills">
        <span class="status-pill pill-todo">${todo}</span>
        <span class="status-pill pill-progress">${progress}</span>
        <span class="status-pill pill-done">${done}</span>
      </div>`;
  },

  sprintSectionHtml(sprint, tasks) {
    const collapsed = this.collapsedIds.has(sprint.sprintId);
    const actionBtn =
      sprint.status === "Active"
        ? `<button class="btn btn-secondary btn-sm" data-complete-sprint="${sprint.sprintId}">Complete sprint</button>`
        : sprint.status === "Completed"
        ? `<span class="badge">Completed</span>`
        : `<button class="btn btn-primary btn-sm" data-start-sprint="${sprint.sprintId}" ${tasks.length === 0 ? "disabled" : ""}>Start sprint</button>`;

    return `
      <div class="backlog-section" data-sprint-id="${sprint.sprintId}">
        <div class="backlog-section-header ${collapsed ? "collapsed" : ""}" data-toggle="${sprint.sprintId}">
          <span class="chevron">${Icon.chevronDown}</span>
          <span class="sname">${UI.escapeHtml(sprint.sprintName)}</span>
          <span class="sdates">${UI.formatDate(sprint.startDate)} – ${UI.formatDate(sprint.endDate)}</span>
          <span class="scount">(${tasks.length} work item${tasks.length === 1 ? "" : "s"})</span>
          <span class="spacer"></span>
          ${this.countPills(tasks)}
          ${actionBtn}
        </div>
        <div class="backlog-body drop-zone" data-drop-sprint="${sprint.sprintId}" style="${collapsed ? "display:none;" : ""}">
          ${
            tasks.length === 0
              ? `<div class="empty-state tab-empty" style="padding:24px 10px;">
                  ${Icon.emptyBoard}
                  <h3>Plan your sprint</h3>
                  <p>Drag work items from the Backlog section or create new ones to plan the work for this sprint. Select <b>Start sprint</b> when you're ready.</p>
                 </div>`
              : tasks.map((t) => this.rowHtml(t)).join("")
          }
          <div class="backlog-create-row"><button class="btn-text btn-sm" data-quick-add="${sprint.sprintId}">${Icon.plus}Create</button></div>
        </div>
      </div>`;
  },

  backlogSectionHtml(tasks) {
    return `
      <div class="backlog-section" data-sprint-id="0">
        <div class="backlog-section-header" data-toggle="0">
          <span class="chevron">${Icon.chevronDown}</span>
          <span class="sname">Backlog</span>
          <span class="scount">(${tasks.length} work item${tasks.length === 1 ? "" : "s"})</span>
          <span class="spacer"></span>
          ${this.countPills(tasks)}
        </div>
        <div class="backlog-body drop-zone" data-drop-sprint="0">
          ${tasks.length === 0 ? `<p style="color:var(--text-400);font-size:13px;padding:10px 8px;">Your backlog is empty.</p>` : tasks.map((t) => this.rowHtml(t)).join("")}
          <div class="backlog-create-row"><button class="btn-text btn-sm" data-quick-add="0">${Icon.plus}Create</button></div>
        </div>
      </div>`;
  },

  rowHtml(t) {
    return `
      <div class="backlog-row" draggable="true" data-task-id="${t.taskId}">
        <span class="drag-handle">${Icon.more}</span>
        <span class="dot dot-${t.status === "ToDo" ? "todo" : t.status === "InProgress" ? "progress" : t.status === "Review" ? "review" : "done"}"></span>
        <span class="row-title">${UI.escapeHtml(t.title)}</span>
        <span class="priority-tag priority-${t.priority}">${t.priority}</span>
        ${t.storyPoints ? `<span class="sp-badge">${t.storyPoints} SP</span>` : ""}
        ${UI.avatarHtml(t.assignedToName, "sm")}
      </div>`;
  },

  wireInteractions(container, ctx, sprints, sprintTaskLists, backlogTasks) {
    const allTasksById = new Map();
    sprints.forEach((s, i) => sprintTaskLists[i].forEach((t) => allTasksById.set(t.taskId, t)));
    backlogTasks.forEach((t) => allTasksById.set(t.taskId, t));

    container.querySelectorAll("[data-toggle]").forEach((header) => {
      header.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        const id = Number(header.dataset.toggle);
        this.collapsedIds.has(id) ? this.collapsedIds.delete(id) : this.collapsedIds.add(id);
        this.render(container, ctx);
      });
    });

    container.querySelectorAll("[data-start-sprint]").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await Api.sprints.updateStatus(Number(btn.dataset.startSprint), "Active");
          UI.toast("Sprint started", "success");
          this.render(container, ctx);
        } catch (err) {
          UI.toast(err.message || "Could not start sprint", "error");
        }
      })
    );
    container.querySelectorAll("[data-complete-sprint]").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await Api.sprints.updateStatus(Number(btn.dataset.completeSprint), "Completed");
          UI.toast("Sprint completed", "success");
          this.render(container, ctx);
        } catch (err) {
          UI.toast(err.message || "Could not complete sprint", "error");
        }
      })
    );

    container.querySelectorAll("[data-quick-add]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sprintId = Number(btn.dataset.quickAdd) || null;
        const wrap = document.createElement("div");
        wrap.className = "backlog-quick-add";
        wrap.innerHTML = `<input class="input" placeholder="What needs to be done?" autofocus />`;
        btn.parentElement.replaceWith(wrap);
        const input = wrap.querySelector("input");
        input.focus();
        const submit = async () => {
          const title = input.value.trim();
          if (!title) { this.render(container, ctx); return; }
          try {
            await Api.tasks.create({ projectId: ctx.project.projectId, sprintId, title, storyPoints: 0, priority: "Medium" });
            this.render(container, ctx);
          } catch (err) {
            UI.toast(err.message || "Could not create task", "error");
          }
        };
        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") submit();
          if (ev.key === "Escape") this.render(container, ctx);
        });
        input.addEventListener("blur", submit);
      });
    });

    container.querySelectorAll(".backlog-row").forEach((row) => {
      row.addEventListener("click", () => {
        const task = allTasksById.get(Number(row.dataset.taskId));
        TaskModal.openDetail({ task, project: ctx.project, session: ctx.session, sprints, onUpdated: () => this.render(container, ctx) });
      });
      row.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", row.dataset.taskId);
        e.dataTransfer.effectAllowed = "move";
      });
    });

    container.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drag-over"); });
      zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
      zone.addEventListener("drop", async (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        const taskId = Number(e.dataTransfer.getData("text/plain"));
        const targetSprintId = Number(zone.dataset.dropSprint) || 0;
        try {
          await Api.tasks.moveToSprint(taskId, targetSprintId);
          this.render(container, ctx);
        } catch (err) {
          UI.toast(err.message || "Could not move item", "error");
        }
      });
    });
  },

  openCreateSprintModal(container, ctx) {
    const today = new Date();
    const twoWeeksOut = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const toInputDate = (d) => d.toISOString().slice(0, 10);

    const overlay = UI.openModal(`
      <div class="modal-header"><h2>Create sprint</h2><button class="btn-icon" id="csCloseBtn">${Icon.close}</button></div>
      <div id="csError"></div>
      <form id="csForm">
        <div class="field"><label>Sprint name</label><input class="input" id="csName" required value="Sprint ${new Date().getTime().toString().slice(-3)}" /></div>
        <div class="field"><label>Goal (optional)</label><textarea class="textarea" id="csGoal" placeholder="What should this sprint achieve?"></textarea></div>
        <div class="task-detail-grid">
          <div class="field"><label>Start date</label><input class="input" type="date" id="csStart" required value="${toInputDate(today)}" /></div>
          <div class="field"><label>End date</label><input class="input" type="date" id="csEnd" required value="${toInputDate(twoWeeksOut)}" /></div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="csCancelBtn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="csSubmitBtn">Create sprint</button>
        </div>
      </form>
    `);
    const close = () => UI.closeModal(overlay);
    overlay.querySelector("#csCloseBtn").addEventListener("click", close);
    overlay.querySelector("#csCancelBtn").addEventListener("click", close);
    overlay.querySelector("#csForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errBox = overlay.querySelector("#csError");
      const btn = overlay.querySelector("#csSubmitBtn");
      btn.disabled = true;
      btn.textContent = "Creating...";
      try {
        await Api.sprints.create({
          projectId: ctx.project.projectId,
          sprintName: overlay.querySelector("#csName").value.trim(),
          goal: overlay.querySelector("#csGoal").value.trim() || null,
          startDate: overlay.querySelector("#csStart").value,
          endDate: overlay.querySelector("#csEnd").value,
        });
        close();
        UI.toast("Sprint created", "success");
        this.render(container, ctx);
      } catch (err) {
        errBox.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message || "Could not create sprint.")}</div>`;
        btn.disabled = false;
        btn.textContent = "Create sprint";
      }
    });
  },
};
