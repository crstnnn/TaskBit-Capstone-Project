(function () {
  const session = Session.requireOrRedirect();
  if (!session) return;

  const params = new URLSearchParams(window.location.search);
  const projectId = Number(params.get("id"));
  if (!projectId) {
    window.location.href = "/spaces.html";
    return;
  }

  const TABS = [
    { key: "board", label: "Board", icon: Icon.board, module: Board },
    { key: "backlog", label: "Backlog", icon: Icon.list, module: Backlog },
    { key: "calendar", label: "Calendar", icon: Icon.calendar, module: Calendar },
    { key: "list", label: "List", icon: Icon.list, module: List },
    { key: "docs", label: "Docs", icon: Icon.doc, module: null },
    { key: "reports", label: "Reports", icon: Icon.report, module: Reports },
  ];

  document.getElementById("appRoot").innerHTML = `<div class="spinner" style="margin-top:120px;"></div>`;

  Api.projects
    .getById(projectId)
    .then((project) => init(project))
    .catch(() => {
      UI.toast("That project could not be found.", "error");
      window.location.href = "/spaces.html";
    });

  function init(project) {
    const key = UI.projectKey(project);
    const mounted = Layout.mount({
      active: "project",
      crumbTitle: project.projectName,
      crumbPath: `TaskBit / Projects / ${key}`,
      searchPlaceholder: "Search this project...",
    });
    if (!mounted) return;

    const pageContent = mounted.pageContent;
    pageContent.innerHTML = `
      <div class="project-shell-header">
        <div class="project-crumb">Projects</div>
        <div class="project-title-row">
          ${UI.tileHtml(project.projectName, "md")}
          <span class="ptitle">${UI.escapeHtml(project.projectName)}</span>
          <span class="pkey-badge">${key}</span>
        </div>
      </div>
      <nav class="project-tabs" id="projectTabs">
        ${TABS.map((t) => `<button class="project-tab" data-tab="${t.key}">${t.icon}${t.label}</button>`).join("")}
      </nav>
      <div class="project-tab-content" id="projectTabContent"></div>
    `;

    const tabContent = document.getElementById("projectTabContent");
    const ctx = { project, session, switchTab: (key) => setActiveTab(key) };

    function setActiveTab(tabKey) {
      const tab = TABS.find((t) => t.key === tabKey) || TABS[0];
      document.querySelectorAll(".project-tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab.key));
      history.replaceState(null, "", `/project.html?id=${projectId}&tab=${tab.key}`);

      if (!tab.module) {
        tabContent.innerHTML = `
          <div class="empty-state tab-empty">
            ${Icon.emptyBacklog}
            <h3>${tab.label} coming soon</h3>
            <p>This area isn't wired up to the backend yet — it's here so the navigation matches the full TaskBit experience.</p>
          </div>`;
        return;
      }
      tab.module.render(tabContent, ctx);
    }

    document.querySelectorAll(".project-tab").forEach((btn) => {
      btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
    });

    const initialTab = params.get("tab") || "board";
    setActiveTab(initialTab);
  }
})();
