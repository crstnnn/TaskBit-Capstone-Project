const Layout = {
  /**
   * Renders the sidebar + topbar shell into #appRoot and returns a reference
   * to the empty #pageContent container the page should fill.
   * opts: { active: 'foryou'|'project'|'filters'|'dashboards', crumbTitle, crumbPath, searchPlaceholder }
   */
  mount(opts) {
    const session = Session.requireOrRedirect();
    if (!session) return null;

    const root = document.getElementById("appRoot");
    root.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="sidebar-brand">
            <span class="logo-mark">${Icon.rocket}</span>
            <div class="brand-text">
              <div class="name">TaskBit</div>
              <div class="tagline">Agile Collaboration Platform</div>
            </div>
          </div>

          <div class="sidebar-section-label">Main</div>
          <nav class="sidebar-nav">
            <button class="sidebar-link" data-nav="foryou">${Icon.home}<span class="label">For you</span></button>
            <a class="sidebar-link" data-nav="project" href="/spaces.html">${Icon.folder}<span class="label">Project</span></a>
            <button class="sidebar-link" data-nav="filters">${Icon.filter}<span class="label">Filters</span></button>
            <button class="sidebar-link" data-nav="dashboards">${Icon.grid}<span class="label">Dashboards</span></button>
          </nav>

          <div class="sidebar-spacer"></div>

          <div class="sidebar-bottom">
            <div class="sidebar-section-label">System</div>
            <button class="sidebar-link" data-nav="notifications">
              ${Icon.bell}<span class="label">Notifications</span>
              <span class="count-badge hidden" id="sidebarNotifBadge">0</span>
            </button>
            <div class="sidebar-user">
              ${UI.avatarHtml(session.fullName, "md")}
              <div class="info">
                <div class="name">${UI.escapeHtml(session.fullName)}</div>
                <div class="role">${UI.escapeHtml(session.roleName || "Member")}</div>
              </div>
              <button class="logout-btn" id="sidebarLogoutBtn" title="Log out">${Icon.logout}</button>
            </div>
          </div>
        </aside>

        <div class="main-col">
          <header class="topbar">
            <button class="btn-icon" id="menuToggleBtn">${Icon.menu}</button>
            <div class="crumb-block">
              <div class="crumb-title">${UI.escapeHtml(opts.crumbTitle || "")}</div>
              <div class="crumb-path">${UI.escapeHtml(opts.crumbPath || "")}</div>
            </div>
            <div class="topbar-search search-input-wrap">
              <span class="icon">${Icon.search}</span>
              <input class="input" id="topbarSearch" placeholder="${UI.escapeHtml(opts.searchPlaceholder || "Search tasks, sprints, projects...")}" />
            </div>
            <div class="icon-btn-wrap">
              <button class="btn-icon" id="topbarBellBtn">${Icon.bell}</button>
              <span class="notif-badge hidden" id="topbarNotifBadge">0</span>
            </div>
            <div class="user-chip" id="topbarUserChip">
              ${UI.avatarHtml(session.fullName, "sm")}
              <div class="info">
                <div class="name">${UI.escapeHtml(session.fullName)}</div>
                <div class="role">${UI.escapeHtml(session.roleName || "Member")}</div>
              </div>
            </div>
          </header>

          <main id="pageContent"></main>
        </div>
      </div>
    `;

    const activeLink = root.querySelector(`.sidebar-link[data-nav="${opts.active}"]`);
    activeLink?.classList.add("active");

    root.querySelector("#sidebarLogoutBtn").addEventListener("click", () => {
      Session.clear();
      window.location.href = "/login.html";
    });
    root.querySelector("#topbarUserChip").addEventListener("click", () => {
      if (confirm("Log out of TaskBit?")) {
        Session.clear();
        window.location.href = "/login.html";
      }
    });
    root.querySelector("#menuToggleBtn").addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("collapsed");
    });

    return { session, pageContent: document.getElementById("pageContent") };
  },
};
