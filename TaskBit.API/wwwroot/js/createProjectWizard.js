const CreateProjectWizard = {
  deriveKey(name) {
    const letters = (name || "").replace(/[^a-zA-Z0-9]/g, " ").trim().split(/\s+/).filter(Boolean).map((w) => w[0]).join("").toUpperCase();
    return (letters || "SPC").slice(0, 4);
  },

  open({ session, onCreated }) {
    const state = { name: "", key: "", keyManuallyEdited: false };

    const overlay = document.createElement("div");
    overlay.className = "wizard-overlay";
    overlay.innerHTML = `
      <div class="wizard-modal">
        <button class="wizard-close" id="wizCloseBtn">${Icon.close}</button>
        <div class="wizard-left">
          <button class="wizard-back" id="wizBackBtn">${Icon.chevronLeft} Back to templates</button>
          <h1>Name your Project</h1>
          <div class="wizard-required-hint">Required fields are marked with an asterisk <span class="req">*</span></div>

          <div class="wizard-field">
            <label>Name <span class="req">*</span></label>
            <input class="wizard-input" id="wizName" placeholder="Try a team name, project goal, milestone..." autofocus />
            <div class="wizard-field-error hidden" id="wizNameError">Project name is required.</div>
          </div>

          <div class="wizard-field">
            <label>How your project is managed</label>
            <div class="wizard-static-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Team-managed
            </div>
          </div>

          <div class="wizard-field">
            <label>Access</label>
            <div class="wizard-static-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Private
            </div>
          </div>

          <div class="wizard-field">
            <label>Key <span class="req">*</span> <span class="info-dot" title="Auto-generated from your project name — you can edit it.">i</span></label>
            <input class="wizard-input" id="wizKey" placeholder="e.g. SPC" maxlength="4" style="text-transform:uppercase;" />
          </div>

          <div class="wizard-field">
            <div class="wizard-template-row">
              <label style="margin:0;">Template</label>
            </div>
            <div class="wizard-template-card">
              <div class="wizard-template-thumb"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
              <div class="wizard-template-body">
                <div class="t-title">Scrum</div>
                <div class="t-sub"><span class="logo-mini">${Icon.rocket}</span>TaskBit</div>
                <div class="t-desc">Sprint toward your project goals with a board, backlog, and timeline.</div>
              </div>
            </div>
          </div>

          <div class="wizard-left-spacer"></div>
          <div class="wizard-footer">
            <span class="wizard-step-label">Step 1 of 3</span>
            <button class="wizard-next-btn" id="wizNextBtn">Next</button>
          </div>
        </div>

        <div class="wizard-right">
          <div class="wizard-preview-crumb">Team-managed project</div>
          <div class="wizard-preview-title" id="wizPreviewTitle">My Project</div>
          <div class="wizard-preview-tabs">
            <span class="wizard-preview-tab">${Icon.list} List</span>
            <span class="wizard-preview-tab active">${Icon.board} Board</span>
            <span class="wizard-preview-tab">Timeline</span>
            <span class="wizard-preview-tab">${Icon.calendar} Calendar</span>
            <span class="wizard-preview-tab">${Icon.list} Backlog</span>
            <span class="wizard-preview-tab">Development</span>
            <span class="wizard-preview-tab">More</span>
          </div>
          <div class="wizard-preview-avatar"></div>
          <div class="wizard-preview-board">
            ${this.previewColumnHtml("TO DO", "var(--status-done)", "2")}
            ${this.previewColumnHtml("IN PROGRESS", "var(--priority-medium)", "3")}
            ${this.previewColumnHtml("DONE", "var(--status-progress)", "4")}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    overlay.querySelector("#wizCloseBtn").addEventListener("click", close);
    overlay.querySelector("#wizBackBtn").addEventListener("click", close);

    const nameInput = overlay.querySelector("#wizName");
    const keyInput = overlay.querySelector("#wizKey");
    const previewTitle = overlay.querySelector("#wizPreviewTitle");

    nameInput.addEventListener("input", () => {
      state.name = nameInput.value;
      previewTitle.textContent = state.name.trim() || "My Project";
      overlay.querySelector("#wizNameError").classList.add("hidden");
      if (!state.keyManuallyEdited) {
        state.key = this.deriveKey(state.name);
        keyInput.value = state.key;
        this.updatePreviewKeys(overlay, state.key);
      }
    });
    keyInput.addEventListener("input", () => {
      state.keyManuallyEdited = true;
      state.key = keyInput.value.toUpperCase().slice(0, 4);
      keyInput.value = state.key;
      this.updatePreviewKeys(overlay, state.key || "SPC");
    });

    overlay.querySelector("#wizNextBtn").addEventListener("click", async () => {
      if (!state.name.trim()) {
        overlay.querySelector("#wizNameError").classList.remove("hidden");
        return;
      }

      const btn = overlay.querySelector("#wizNextBtn");
      btn.disabled = true;
      btn.textContent = "Creating...";
      try {
        const result = await Api.projects.create({
          projectName: state.name.trim(),
          description: null,
          createdByUserId: session.userId,
        });
        close();
        onCreated?.(result);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Next";
        UI.toast(err.message || "Could not create project.", "error");
      }
    });
  },

  previewColumnHtml(label, dotColor, num) {
    return `
      <div class="wizard-preview-col">
        <div class="colhead">${label}</div>
        <div class="wizard-preview-card">
          <div class="squiggle">
            <svg width="100%" height="18" viewBox="0 0 140 18" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round"><path d="M2 9c8-8 16 8 24 0s16-8 24 0 16 8 24 0 16-8 24 0 16 8 24 0"/></svg>
          </div>
          <div class="card-foot">
            <span class="card-key"><span class="type-dot" style="background:${dotColor}"></span><span data-preview-key>SPC-${num}</span></span>
            <span class="card-avatar"></span>
          </div>
        </div>
      </div>`;
  },

  updatePreviewKeys(overlay, key) {
    overlay.querySelectorAll("[data-preview-key]").forEach((el) => {
      const num = el.textContent.split("-").pop();
      el.textContent = `${key}-${num}`;
    });
  },
};
