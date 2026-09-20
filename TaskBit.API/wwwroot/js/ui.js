const UI = {
  escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  },

  initials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  colorFor(seed) {
    const palette = ["#c0152c", "#0052cc", "#1f8a4c", "#b36d00", "#5243aa", "#00838f", "#a3152a", "#403294"];
    let hash = 0;
    const s = String(seed ?? "");
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  },

  avatarHtml(name, size = "md") {
    const bg = this.colorFor(name);
    return `<span class="avatar avatar-${size}" style="background:${bg}" title="${this.escapeHtml(name || "Unassigned")}">${this.initials(name)}</span>`;
  },

  tileHtml(name, size = "md") {
    const bg = this.colorFor(name);
    return `<span class="tile tile-${size}" style="background:${bg}">${this.escapeHtml((name || "?").slice(0, 1).toUpperCase())}</span>`;
  },

  projectKey(project) {
    const name = project.projectName || project.ProjectName || "";
    const letters = name.replace(/[^a-zA-Z0-9]/g, " ").trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase();
    const key = (letters || "PRJ").slice(0, 4);
    return key || `P${project.projectId ?? project.ProjectId}`;
  },

  formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  },

  toast(message, type = "default") {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  },

  openModal(innerHtml, { onMount } = {}) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal">${innerHtml}</div>`;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    if (onMount) onMount(overlay);
    return overlay;
  },

  closeModal(overlayEl) {
    overlayEl?.remove();
  },
};
