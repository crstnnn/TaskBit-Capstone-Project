// Same-origin API base: the frontend is served by TaskBit.API's wwwroot,
// so relative URLs work regardless of which port Kestrel picks.
const API_BASE = "/api";

const Session = {
  KEY: "taskbit.session",

  save(authResponse) {
    const payload = TaskBitJwt.decode(authResponse.token);
    const session = {
      token: authResponse.token,
      userId: Number(payload?.nameid ?? payload?.sub ?? 0),
      fullName: authResponse.fullName,
      email: payload?.email ?? "",
      roleName: authResponse.roleName,
    };
    localStorage.setItem(this.KEY, JSON.stringify(session));
    return session;
  },

  get() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },

  requireOrRedirect() {
    const session = this.get();
    if (!session || !session.token) {
      window.location.href = "/login.html";
      return null;
    }
    return session;
  },
};

const TaskBitJwt = {
  decode(token) {
    try {
      const payload = token.split(".")[1];
      const json = decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  },
};

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function apiRequest(method, path, body) {
  const session = Session.get();
  const headers = { "Content-Type": "application/json" };
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    Session.clear();
    window.location.href = "/login.html";
    throw new ApiError("Unauthorized", 401, null);
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data;
}

const Api = {
  auth: {
    register: (dto) => apiRequest("POST", "/auth/register", dto),
    login: (dto) => apiRequest("POST", "/auth/login", dto),
  },
  projects: {
    getForUser: (userId) => apiRequest("GET", `/projects/user/${userId}`),
    getById: (projectId) => apiRequest("GET", `/projects/${projectId}`),
    create: (project) => apiRequest("POST", "/projects", project),
    addMember: (member) => apiRequest("POST", "/projects/members", member),
    setWorkloadLimit: (limit) => apiRequest("PUT", "/projects/workload-limit", limit),
  },
  sprints: {
    getByProject: (projectId) => apiRequest("GET", `/sprints/project/${projectId}`),
    getById: (sprintId) => apiRequest("GET", `/sprints/${sprintId}`),
    getBoard: (sprintId) => apiRequest("GET", `/sprints/${sprintId}/board`),
    create: (dto) => apiRequest("POST", "/sprints", dto),
    updateStatus: (sprintId, status) => apiRequest("PUT", `/sprints/${sprintId}/status`, status),
  },
  tasks: {
    getById: (taskId) => apiRequest("GET", `/tasks/${taskId}`),
    getBacklog: (projectId) => apiRequest("GET", `/tasks/backlog/${projectId}`),
    create: (dto) => apiRequest("POST", "/tasks", dto),
    checkLoad: (userId, projectId, storyPoints) =>
      apiRequest("GET", `/tasks/load-check?userId=${userId}&projectId=${projectId}&storyPoints=${storyPoints}`),
    assign: (dto, overrideLimit) =>
      apiRequest("POST", `/tasks/assign${overrideLimit ? "?overrideLimit=true" : ""}`, dto),
    updateStatus: (dto) => apiRequest("PUT", "/tasks/status", dto),
    moveToSprint: (taskId, sprintId) => apiRequest("PUT", `/tasks/${taskId}/move-to-sprint/${sprintId ?? 0}`),
  },
};
