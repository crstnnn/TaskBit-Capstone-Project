const TaskModal = {
  /** Quick "create task" modal. opts: { projectId, sprintId, defaultTitle, onCreated } */
  openCreate(opts) {
    const overlay = UI.openModal(`
      <div class="modal-header"><h2>Create work item</h2><button class="btn-icon" id="tmCloseBtn">${Icon.close}</button></div>
      <div id="tmError"></div>
      <form id="tmCreateForm">
        <div class="field">
          <label>Title</label>
          <input class="input" id="tmTitle" required placeholder="e.g. Design the login screen" value="${UI.escapeHtml(opts.defaultTitle || "")}" />
        </div>
        <div class="field">
          <label>Description (optional)</label>
          <textarea class="textarea" id="tmDescription" placeholder="Add details..."></textarea>
        </div>
        <div class="task-detail-grid">
          <div class="field">
            <label>Priority</label>
            <select class="select" id="tmPriority">
              <option value="Low">Low</option>
              <option value="Medium" selected>Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div class="field">
            <label>Story points</label>
            <input class="input" id="tmStoryPoints" type="number" min="0" max="99" value="0" />
          </div>
        </div>
        <div class="field">
          <label>Due date (optional)</label>
          <input class="input" id="tmDueDate" type="date" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="tmCancelBtn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="tmSubmitBtn">Create</button>
        </div>
      </form>
    `);
    const close = () => UI.closeModal(overlay);
    overlay.querySelector("#tmCloseBtn").addEventListener("click", close);
    overlay.querySelector("#tmCancelBtn").addEventListener("click", close);
    overlay.querySelector("#tmCreateForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errBox = overlay.querySelector("#tmError");
      errBox.innerHTML = "";
      const btn = overlay.querySelector("#tmSubmitBtn");
      btn.disabled = true;
      btn.textContent = "Creating...";
      try {
        const dueDateVal = overlay.querySelector("#tmDueDate").value;
        const created = await Api.tasks.create({
          projectId: opts.projectId,
          sprintId: opts.sprintId ?? null,
          title: overlay.querySelector("#tmTitle").value.trim(),
          description: overlay.querySelector("#tmDescription").value.trim() || null,
          storyPoints: Number(overlay.querySelector("#tmStoryPoints").value || 0),
          priority: overlay.querySelector("#tmPriority").value,
          dueDate: dueDateVal || null,
        });
        close();
        UI.toast("Work item created", "success");
        opts.onCreated?.(created);
      } catch (err) {
        errBox.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message || "Could not create work item.")}</div>`;
        btn.disabled = false;
        btn.textContent = "Create";
      }
    });
  },

  /** Task detail / edit modal. opts: { task, project, session, sprints, onUpdated } */
  async openDetail(opts) {
    let task = opts.task;
    const sprintOptions = [`<option value="0">Backlog</option>`]
      .concat((opts.sprints || []).map((s) => `<option value="${s.sprintId}" ${task.sprintId === s.sprintId ? "selected" : ""}>${UI.escapeHtml(s.sprintName)}</option>`))
      .join("");

    const overlay = UI.openModal(`
      <div class="modal-header">
        <span class="badge">${UI.projectKey(opts.project)}-${task.taskId}</span>
        <button class="btn-icon" id="tdCloseBtn">${Icon.close}</button>
      </div>
      <div class="task-detail-title">${UI.escapeHtml(task.title)}</div>
      <div id="tdError"></div>
      ${task.description ? `<p style="color:var(--text-600);font-size:13.5px;margin-bottom:14px;white-space:pre-wrap;">${UI.escapeHtml(task.description)}</p>` : ""}

      <div class="task-detail-grid">
        <div class="field">
          <label>Status</label>
          <select class="select" id="tdStatus">
            <option value="ToDo" ${task.status === "ToDo" ? "selected" : ""}>To Do</option>
            <option value="InProgress" ${task.status === "InProgress" ? "selected" : ""}>In Progress</option>
            <option value="Review" ${task.status === "Review" ? "selected" : ""}>Review</option>
            <option value="Done" ${task.status === "Done" ? "selected" : ""}>Done</option>
          </select>
        </div>
        <div class="field">
          <label>Sprint</label>
          <select class="select" id="tdSprint">${sprintOptions}</select>
        </div>
      </div>

      <div class="task-detail-grid">
        <div class="field">
          <label>Priority</label>
          <span class="priority-tag priority-${task.priority}">${task.priority}</span>
        </div>
        <div class="field">
          <label>Story points</label>
          <span>${task.storyPoints}</span>
        </div>
      </div>

      <div class="field">
        <label>Assignee</label>
        <div style="display:flex;align-items:center;gap:8px;">
          ${UI.avatarHtml(task.assignedToName, "sm")}
          <span>${task.assignedToName ? UI.escapeHtml(task.assignedToName) : "Unassigned"}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <input class="input" id="tdAssignUserId" type="number" min="1" placeholder="User ID to assign" style="max-width:160px;" />
          <button class="btn btn-secondary btn-sm" id="tdAssignBtn">Assign</button>
        </div>
        <div id="tdLoadWarning"></div>
      </div>

      ${task.dueDate ? `<div class="field"><label>Due date</label><span>${UI.formatDate(task.dueDate)}</span></div>` : ""}
    `);

    const close = () => UI.closeModal(overlay);
    overlay.querySelector("#tdCloseBtn").addEventListener("click", close);

    overlay.querySelector("#tdStatus").addEventListener("change", async (e) => {
      const newStatus = e.target.value;
      try {
        await Api.tasks.updateStatus({ taskId: task.taskId, status: newStatus });
        task.status = newStatus;
        UI.toast("Status updated", "success");
        opts.onUpdated?.(task);
      } catch (err) {
        overlay.querySelector("#tdError").innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message)}</div>`;
      }
    });

    overlay.querySelector("#tdSprint").addEventListener("change", async (e) => {
      const targetSprintId = Number(e.target.value) || 0;
      try {
        await Api.tasks.moveToSprint(task.taskId, targetSprintId);
        task.sprintId = targetSprintId || null;
        UI.toast("Moved", "success");
        opts.onUpdated?.(task);
      } catch (err) {
        overlay.querySelector("#tdError").innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message)}</div>`;
      }
    });

    overlay.querySelector("#tdAssignBtn").addEventListener("click", async () => {
      const userId = Number(overlay.querySelector("#tdAssignUserId").value);
      const warnBox = overlay.querySelector("#tdLoadWarning");
      warnBox.innerHTML = "";
      if (!userId) {
        warnBox.innerHTML = `<div class="modal-error">Enter a valid user ID.</div>`;
        return;
      }
      try {
        const result = await Api.tasks.assign({ taskId: task.taskId, assignedToUserId: userId }, false);
        UI.toast("Task assigned", "success");
        opts.onUpdated?.(task);
        close();
        return result;
      } catch (err) {
        const loadResult = err.body?.loadResult;
        if (loadResult) {
          warnBox.innerHTML = `<div class="load-warning">${UI.escapeHtml(loadResult.message)}<br/><button class="btn btn-sm btn-danger" id="tdOverrideBtn" style="margin-top:8px;">Assign anyway</button></div>`;
          overlay.querySelector("#tdOverrideBtn")?.addEventListener("click", async () => {
            try {
              await Api.tasks.assign({ taskId: task.taskId, assignedToUserId: userId }, true);
              UI.toast("Task assigned (limit overridden)", "success");
              opts.onUpdated?.(task);
              close();
            } catch (err2) {
              warnBox.innerHTML = `<div class="modal-error">${UI.escapeHtml(err2.message)}</div>`;
            }
          });
        } else {
          warnBox.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message)}</div>`;
        }
      }
    });
  },
};
