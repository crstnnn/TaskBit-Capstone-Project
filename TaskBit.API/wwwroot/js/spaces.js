(function () {
  const mounted = Layout.mount({
    active: "project",
    crumbTitle: "Projects",
    crumbPath: "TaskBit / Projects",
    searchPlaceholder: "Search tasks, sprints, projects...",
  });
  if (!mounted) return;
  const { session, pageContent } = mounted;

  const PAGE_SIZE = 8;
  let allProjects = [];
  let filtered = [];
  let currentPage = 1;

  const starredKey = "taskbit.starred";
  function getStarred() {
    try {
      return new Set(JSON.parse(localStorage.getItem(starredKey) || "[]"));
    } catch {
      return new Set();
    }
  }
  function toggleStar(id) {
    const s = getStarred();
    s.has(id) ? s.delete(id) : s.add(id);
    localStorage.setItem(starredKey, JSON.stringify([...s]));
  }

  pageContent.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1>Projects</h1>
        <button class="btn btn-primary" id="createProjectBtn">${Icon.plus}Create project</button>
      </div>
      <div class="spaces-toolbar">
        <div class="search-input-wrap">
          <span class="icon">${Icon.search}</span>
          <input class="input" id="spacesSearch" placeholder="Search projects" />
        </div>
      </div>
      <div id="spacesTableWrap"></div>
      <div class="spaces-pagination hidden" id="spacesPagination"></div>
    </div>
  `;

  const tableWrap = document.getElementById("spacesTableWrap");
  const paginationEl = document.getElementById("spacesPagination");

  function projectUrl(id) {
    return `${window.location.origin}/project.html?id=${id}`;
  }

  function renderTable() {
    if (filtered.length === 0) {
      tableWrap.innerHTML = `
        <div class="empty-state" style="background:#fff;border:1px solid var(--border);border-radius:var(--radius-lg);">
          ${Icon.emptyBacklog}
          <h3>${allProjects.length === 0 ? "No projects yet" : "No projects match your search"}</h3>
          <p>${allProjects.length === 0 ? "Create your first project to start planning sprints and tracking work." : "Try a different search term."}</p>
          ${allProjects.length === 0 ? `<button class="btn btn-primary" id="emptyCreateBtn">${Icon.plus}Create project</button>` : ""}
        </div>`;
      document.getElementById("emptyCreateBtn")?.addEventListener("click", openCreateModal);
      paginationEl.classList.add("hidden");
      return;
    }

    const starred = getStarred();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    tableWrap.innerHTML = `
      <table class="spaces-table">
        <thead>
          <tr>
            <th class="star-col"></th>
            <th>Name</th>
            <th>Key</th>
            <th>Type</th>
            <th>Lead</th>
            <th>Project URL</th>
            <th style="width:40px;"></th>
          </tr>
        </thead>
        <tbody>
          ${pageItems
            .map((p) => {
              const id = p.projectId;
              const key = UI.projectKey(p);
              const isLead = p.createdByUserId === session.userId;
              const leadName = isLead ? session.fullName : "Team member";
              return `
              <tr data-id="${id}">
                <td class="star-col">
                  <button class="star-btn ${starred.has(id) ? "active" : ""}" data-star="${id}" title="Star">${Icon.star}</button>
                </td>
                <td>
                  <div class="space-name-cell">
                    ${UI.tileHtml(p.projectName, "sm")}
                    <span class="pname">${UI.escapeHtml(p.projectName)}</span>
                  </div>
                </td>
                <td>${key}</td>
                <td>Team-managed software</td>
                <td>
                  <div class="space-name-cell">${UI.avatarHtml(leadName, "sm")}<span>${UI.escapeHtml(leadName)}</span></div>
                </td>
                <td>
                  <div class="url-cell">
                    <span>/project.html?id=${id}</span>
                    <button data-copy="${id}" title="Copy link">${Icon.link}</button>
                  </div>
                </td>
                <td><button class="btn-icon" data-more="${id}">${Icon.more}</button></td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `;

    tableWrap.querySelectorAll("tr[data-id]").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("[data-star]") || e.target.closest("[data-copy]") || e.target.closest("[data-more]")) return;
        window.location.href = `/project.html?id=${row.dataset.id}`;
      });
    });
    tableWrap.querySelectorAll("[data-star]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleStar(Number(btn.dataset.star));
        renderTable();
      });
    });
    tableWrap.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(projectUrl(btn.dataset.copy));
          UI.toast("Project link copied to clipboard", "success");
        } catch {
          UI.toast("Could not copy link", "error");
        }
      });
    });

    if (totalPages > 1) {
      paginationEl.classList.remove("hidden");
      let html = `<button class="page-num" id="pagePrev" ${currentPage === 1 ? "disabled" : ""}>${Icon.chevronLeft}</button>`;
      for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-num ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
      }
      html += `<button class="page-num" id="pageNext" ${currentPage === totalPages ? "disabled" : ""}>${Icon.chevronRight}</button>`;
      paginationEl.innerHTML = html;
      paginationEl.querySelectorAll("[data-page]").forEach((b) => b.addEventListener("click", () => { currentPage = Number(b.dataset.page); renderTable(); }));
      paginationEl.querySelector("#pagePrev")?.addEventListener("click", () => { currentPage--; renderTable(); });
      paginationEl.querySelector("#pageNext")?.addEventListener("click", () => { currentPage++; renderTable(); });
    } else {
      paginationEl.classList.add("hidden");
    }
  }

  function applySearch(term) {
    const q = term.trim().toLowerCase();
    filtered = !q ? allProjects : allProjects.filter((p) => p.projectName.toLowerCase().includes(q));
    currentPage = 1;
    renderTable();
  }

  document.getElementById("spacesSearch").addEventListener("input", (e) => applySearch(e.target.value));

  function openCreateModal() {
    CreateProjectWizard.open({
      session,
      onCreated: (result) => {
        window.location.href = `/project.html?id=${result.projectId}`;
      },
    });
  }

  document.getElementById("createProjectBtn").addEventListener("click", openCreateModal);

  async function load() {
    tableWrap.innerHTML = `<div class="spinner"></div>`;
    try {
      allProjects = await Api.projects.getForUser(session.userId);
      filtered = allProjects;
      renderTable();
    } catch (err) {
      tableWrap.innerHTML = `<div class="modal-error">${UI.escapeHtml(err.message || "Could not load your projects.")}</div>`;
    }
  }

  load();
})();
