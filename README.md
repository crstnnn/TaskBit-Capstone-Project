# TaskBit

Web-based Agile collaboration platform: an ASP.NET Core Web API (C#, Dapper,
SQL Server) backend, and a Jira-style vanilla HTML/CSS/JS frontend served
straight from the API's `wwwroot`.

## Folder structure

```
TaskBit-Backend/
├── Database/
│   ├── TaskBit_Schema.sql            <- run this in SSMS FIRST (tables + base indexes)
│   └── TaskBit_StoredProcedures.sql  <- run this SECOND (stored procs + extra indexes)
└── TaskBit.API/
    ├── Controllers/               <- API endpoints
    ├── Data/DapperContext.cs      <- SQL connection factory
    ├── DTOs/                      <- request/response objects
    ├── Models/                    <- POCOs matching DB tables
    ├── Repositories/              <- Dapper calls to SQL Server stored procedures
    ├── Services/                  <- business logic (Task Load Checker, Auth/JWT)
    ├── wwwroot/                   <- the frontend (HTML/CSS/JS), served on the same origin
    │   ├── login.html / spaces.html / project.html
    │   ├── css/                   <- variables, base, layout, per-page styles
    │   └── js/                    <- api.js (fetch client), layout.js, one module per tab
    ├── Program.cs
    ├── appsettings.json
    └── TaskBit.API.csproj
```

## Frontend

The UI lives in `TaskBit.API/wwwroot` and is plain HTML/CSS/JS (no build
step, no framework). It's served by the same Kestrel process as the API
(`app.UseStaticFiles()` in `Program.cs`), so it calls the API with relative
`/api/...` URLs — no CORS setup or port-matching needed. Just run the API
(F5, or `dotnet run` from `TaskBit.API/`) and open the printed
`https://localhost:XXXX` URL in a browser; it lands on the login page.

Pages:
- **login.html** — log in / create an account (JWT stored in `localStorage`).
- **spaces.html** — the project list ("Spaces"), matching the Jira-style
  mockups: search, star, create a project.
- **project.html** — a single project shell with tabs: **Board** (Kanban for
  the active sprint, drag-and-drop status changes), **Backlog** (sprint
  sections + project backlog, quick-add, start/complete sprint, drag tasks
  between sprint/backlog), **List** (flat task table), **Calendar** (month
  view keyed off task due dates), **Reports** (simple stat cards from the
  same task data). **Docs** has no backend feature yet, so it's a labeled
  placeholder — see "Known gaps" below.

Known gaps (backend has no endpoint for these yet, so the frontend
compensates or leaves them out):
- No "list project members" endpoint — the assignee picker on a task takes
  a raw user ID rather than a dropdown of project members.
- No project "Key" or "Type" column in the DB — the frontend derives a
  display-only key from the project name and shows a static type label.
- No endpoint to update a task's title/description/points after creation —
  the task detail modal can only change status, sprint, and assignee.

## Setup in Visual Studio 2022

1. **Create the database.**
   Open SSMS, connect to your local SQL Server instance.
   - Open `Database/TaskBit_Schema.sql` and run it (F5). This creates the
     `TaskBitDB` database with all 12 tables, seed roles, and base indexes.
   - Then open `Database/TaskBit_StoredProcedures.sql` and run it (F5).
     This adds the stored procedures every repository calls, plus extra
     indexes (`IX_Sprints_Project_Status`, `IX_Tasks_Sprint_Status`,
     `IX_ProjectMembers_User`, `IX_DailyStandups_Sprint_Date`,
     `IX_ActivityLogs_User_Timestamp`, `IX_TaskComments_Task`).
   - In SSMS Object Explorer you should now see everything under
     `TaskBitDB > Programmability > Stored Procedures` (e.g.
     `sp_Tasks_GetProjectBacklog`, `sp_Tasks_Assign`) and
     `TaskBitDB > Tables > <table> > Indexes`.

2. **Open the project.**
   In Visual Studio 2022: `File > Open > Project/Folder` and select the
   `TaskBit.API` folder (or create a new **ASP.NET Core Web API** project
   named `TaskBit.API` and copy these files into it, matching the folder
   layout above).

3. **Restore NuGet packages.** Visual Studio will do this automatically on
   open, or right-click the solution → *Restore NuGet Packages*. Packages
   used: `Dapper`, `Microsoft.Data.SqlClient`,
   `Microsoft.AspNetCore.Authentication.JwtBearer`,
   `Swashbuckle.AspNetCore` (Swagger), `BCrypt.Net-Next`.

4. **Update the connection string.**
   In `appsettings.json`, edit `ConnectionStrings:TaskBitDB` to match your
   SQL Server instance name (e.g. `.\SQLEXPRESS`, `localhost`, or a named
   instance from SSMS).

5. **Run the project** (F5). Swagger UI opens automatically at
   `/swagger` so you can test every endpoint (register a user, log in to
   get a JWT, then click "Authorize" in Swagger and paste the token to
   call the protected endpoints).

## How the Task Load Checker works

`Services/TaskLoadCheckerService.cs` is the implementation of TaskBit's
core differentiator versus Jira/ClickUp/monday.com. Before a task is
assigned:

1. It reads the project's `WorkloadLimits` (max active tasks, max story
   points — configurable per project).
2. It queries the member's currently active tasks (`Status <> 'Done'`) in
   that project via `ITaskRepository.GetActiveByUserAsync`.
3. It compares current active-task count + story-point total against the
   limits, **including** the task about to be assigned.
4. It returns a `TaskLoadResultDto` the frontend can show to the user
   (e.g. "Member already has 5 active tasks; the limit is 5.").

`TasksController.Assign` calls this automatically, and blocks the
assignment (HTTP 400) unless the caller passes `?overrideLimit=true`
(intended for a TeamLead/Faculty override).

## Key endpoints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT |
| GET | `/api/projects/user/{userId}` | Projects a user belongs to |
| POST | `/api/projects` | Create project |
| POST | `/api/sprints` | Create sprint |
| GET | `/api/sprints/{id}/board` | Sprint board (Sprint Backlog) |
| GET | `/api/tasks/backlog/{projectId}` | Project Backlog |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/load-check?userId=&projectId=&storyPoints=` | Preview Task Load Checker result |
| POST | `/api/tasks/assign` | Assign task (runs Task Load Checker) |
| PUT | `/api/tasks/status` | Update task status |
| POST | `/api/ceremonies/standups` | Log a Daily Scrum entry |
| POST | `/api/ceremonies/reviews` | Log a Sprint Review |
| POST | `/api/ceremonies/retrospectives` | Log a Sprint Retrospective |

## Extending this

This skeleton intentionally covers the features that make TaskBit
different (Task Load Checker, Story Points, Sprints, Agile ceremonies).
Straightforward CRUD you'll likely still add: task comments endpoint,
user profile management, reporting/export endpoints, and role-based
`[Authorize(Roles = "...")]` restrictions per endpoint.
