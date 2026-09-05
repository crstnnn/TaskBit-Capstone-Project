# TaskBit Backend

Web API backend for **TaskBit**, built with C#, ASP.NET Core Web API, Dapper, and SQL Server (SSMS).

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
    ├── Program.cs
    ├── appsettings.json
    └── TaskBit.API.csproj
```

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
