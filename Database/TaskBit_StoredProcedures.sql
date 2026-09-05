/* ============================================================
   TaskBit - Stored Procedures & Additional Indexes
   Run this AFTER TaskBit_Schema.sql
   Target: Microsoft SQL Server (SSMS)
   ============================================================ */

USE TaskBitDB;
GO

/* ============================================================
   ADDITIONAL INDEXES
   (IX_Tasks_AssignedTo_Status and IX_Tasks_Project_Sprint are
   already created in TaskBit_Schema.sql)
   ============================================================ */

CREATE INDEX IX_Sprints_Project_Status ON Sprints(ProjectId, Status);
GO
CREATE INDEX IX_Tasks_Sprint_Status ON Tasks(SprintId, Status);
GO
CREATE INDEX IX_ProjectMembers_User ON ProjectMembers(UserId);
GO
CREATE INDEX IX_DailyStandups_Sprint_Date ON DailyStandups(SprintId, StandupDate);
GO
CREATE INDEX IX_ActivityLogs_User_Timestamp ON ActivityLogs(UserId, Timestamp DESC);
GO
CREATE INDEX IX_TaskComments_Task ON TaskComments(TaskId);
GO
-- Email already has a UNIQUE constraint (which SQL Server backs with an
-- index automatically), so no separate index needed there.


/* ============================================================
   USERS
   ============================================================ */

CREATE OR ALTER PROCEDURE sp_Users_GetByEmail
    @Email VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.*, r.RoleName
    FROM Users u
    INNER JOIN Roles r ON r.RoleId = u.RoleId
    WHERE u.Email = @Email;
END
GO

CREATE OR ALTER PROCEDURE sp_Users_GetById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.*, r.RoleName
    FROM Users u
    INNER JOIN Roles r ON r.RoleId = u.RoleId
    WHERE u.UserId = @UserId;
END
GO

CREATE OR ALTER PROCEDURE sp_Users_Create
    @FullName VARCHAR(150),
    @Email VARCHAR(150),
    @PasswordHash VARCHAR(255),
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Users (FullName, Email, PasswordHash, RoleId, IsActive, CreatedAt)
    OUTPUT INSERTED.UserId
    VALUES (@FullName, @Email, @PasswordHash, @RoleId, 1, GETDATE());
END
GO

CREATE OR ALTER PROCEDURE sp_Users_GetByProject
    @ProjectId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.*, r.RoleName
    FROM Users u
    INNER JOIN Roles r ON r.RoleId = u.RoleId
    INNER JOIN ProjectMembers pm ON pm.UserId = u.UserId
    WHERE pm.ProjectId = @ProjectId;
END
GO


/* ============================================================
   PROJECTS
   ============================================================ */

CREATE OR ALTER PROCEDURE sp_Projects_Create
    @ProjectName VARCHAR(150),
    @Description VARCHAR(1000),
    @CreatedByUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NewProjectId INT;

    INSERT INTO Projects (ProjectName, Description, CreatedByUserId, Status, CreatedAt)
    VALUES (@ProjectName, @Description, @CreatedByUserId, 'Active', GETDATE());

    SET @NewProjectId = SCOPE_IDENTITY();

    -- creator becomes TeamLead automatically
    INSERT INTO ProjectMembers (ProjectId, UserId, ProjectRole, JoinedAt)
    VALUES (@NewProjectId, @CreatedByUserId, 'TeamLead', GETDATE());

    -- default workload limit
    INSERT INTO WorkloadLimits (ProjectId, MaxActiveTasks, MaxStoryPoints)
    VALUES (@NewProjectId, 5, 20);

    SELECT @NewProjectId AS ProjectId;
END
GO

CREATE OR ALTER PROCEDURE sp_Projects_GetById
    @ProjectId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Projects WHERE ProjectId = @ProjectId;
END
GO

CREATE OR ALTER PROCEDURE sp_Projects_GetAllForUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.*
    FROM Projects p
    INNER JOIN ProjectMembers pm ON pm.ProjectId = p.ProjectId
    WHERE pm.UserId = @UserId
    ORDER BY p.CreatedAt DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_ProjectMembers_Add
    @ProjectId INT,
    @UserId INT,
    @ProjectRole VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ProjectMembers (ProjectId, UserId, ProjectRole, JoinedAt)
    VALUES (@ProjectId, @UserId, @ProjectRole, GETDATE());
END
GO

CREATE OR ALTER PROCEDURE sp_WorkloadLimits_Get
    @ProjectId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM WorkloadLimits WHERE ProjectId = @ProjectId;
END
GO

CREATE OR ALTER PROCEDURE sp_WorkloadLimits_Set
    @ProjectId INT,
    @MaxActiveTasks INT,
    @MaxStoryPoints INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE WorkloadLimits
    SET MaxActiveTasks = @MaxActiveTasks, MaxStoryPoints = @MaxStoryPoints
    WHERE ProjectId = @ProjectId;
END
GO


/* ============================================================
   SPRINTS
   ============================================================ */

CREATE OR ALTER PROCEDURE sp_Sprints_Create
    @ProjectId INT,
    @SprintName VARCHAR(100),
    @Goal VARCHAR(500),
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Sprints (ProjectId, SprintName, Goal, StartDate, EndDate, Status, CreatedAt)
    OUTPUT INSERTED.SprintId
    VALUES (@ProjectId, @SprintName, @Goal, @StartDate, @EndDate, 'Planned', GETDATE());
END
GO

CREATE OR ALTER PROCEDURE sp_Sprints_GetById
    @SprintId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Sprints WHERE SprintId = @SprintId;
END
GO

CREATE OR ALTER PROCEDURE sp_Sprints_GetByProject
    @ProjectId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Sprints WHERE ProjectId = @ProjectId ORDER BY StartDate DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_Sprints_UpdateStatus
    @SprintId INT,
    @Status VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Sprints SET Status = @Status WHERE SprintId = @SprintId;
END
GO


/* ============================================================
   TASKS  (includes Project Backlog / Sprint Backlog queries
   and the query behind the Task Load Checker)
   ============================================================ */

CREATE OR ALTER PROCEDURE sp_Tasks_Create
    @ProjectId INT,
    @SprintId INT = NULL,
    @Title VARCHAR(200),
    @Description VARCHAR(1000) = NULL,
    @StoryPoints INT,
    @Priority VARCHAR(20),
    @CreatedByUserId INT,
    @DueDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Tasks
        (ProjectId, SprintId, Title, Description, StoryPoints, Priority, Status,
         CreatedByUserId, DueDate, CreatedAt)
    OUTPUT INSERTED.TaskId
    VALUES
        (@ProjectId, @SprintId, @Title, @Description, @StoryPoints, @Priority, 'ToDo',
         @CreatedByUserId, @DueDate, GETDATE());
END
GO

CREATE OR ALTER PROCEDURE sp_Tasks_GetById
    @TaskId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.*, u.FullName AS AssignedToName
    FROM Tasks t
    LEFT JOIN Users u ON u.UserId = t.AssignedToUserId
    WHERE t.TaskId = @TaskId;
END
GO

-- Project Backlog: tasks not yet pulled into any sprint
CREATE OR ALTER PROCEDURE sp_Tasks_GetProjectBacklog
    @ProjectId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.*, u.FullName AS AssignedToName
    FROM Tasks t
    LEFT JOIN Users u ON u.UserId = t.AssignedToUserId
    WHERE t.ProjectId = @ProjectId AND t.SprintId IS NULL
    ORDER BY t.CreatedAt DESC;
END
GO

-- Sprint Backlog / board: tasks that belong to a specific sprint
CREATE OR ALTER PROCEDURE sp_Tasks_GetBySprint
    @SprintId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.*, u.FullName AS AssignedToName
    FROM Tasks t
    LEFT JOIN Users u ON u.UserId = t.AssignedToUserId
    WHERE t.SprintId = @SprintId
    ORDER BY t.Status, t.Priority DESC;
END
GO

-- Used by the Task Load Checker: a member's active (not Done) tasks in a project
CREATE OR ALTER PROCEDURE sp_Tasks_GetActiveByUser
    @UserId INT,
    @ProjectId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM Tasks
    WHERE AssignedToUserId = @UserId
      AND ProjectId = @ProjectId
      AND Status <> 'Done';
END
GO

CREATE OR ALTER PROCEDURE sp_Tasks_Assign
    @TaskId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tasks SET AssignedToUserId = @UserId WHERE TaskId = @TaskId;
END
GO

CREATE OR ALTER PROCEDURE sp_Tasks_UpdateStatus
    @TaskId INT,
    @Status VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tasks
    SET Status = @Status,
        CompletedAt = CASE WHEN @Status = 'Done' THEN GETDATE() ELSE CompletedAt END
    WHERE TaskId = @TaskId;
END
GO

-- Pass @SprintId = NULL to send a task back to the Project Backlog
CREATE OR ALTER PROCEDURE sp_Tasks_MoveToSprint
    @TaskId INT,
    @SprintId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tasks SET SprintId = @SprintId WHERE TaskId = @TaskId;
END
GO


/* ============================================================
   AGILE CEREMONIES
   ============================================================ */

CREATE OR ALTER PROCEDURE sp_Standups_Create
    @SprintId INT,
    @UserId INT,
    @StandupDate DATE,
    @YesterdayWork VARCHAR(500) = NULL,
    @TodayPlan VARCHAR(500) = NULL,
    @Blockers VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DailyStandups
        (SprintId, UserId, StandupDate, YesterdayWork, TodayPlan, Blockers, CreatedAt)
    OUTPUT INSERTED.StandupId
    VALUES
        (@SprintId, @UserId, @StandupDate, @YesterdayWork, @TodayPlan, @Blockers, GETDATE());
END
GO

CREATE OR ALTER PROCEDURE sp_Standups_GetBySprint
    @SprintId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.*, u.FullName
    FROM DailyStandups s
    INNER JOIN Users u ON u.UserId = s.UserId
    WHERE s.SprintId = @SprintId
    ORDER BY s.StandupDate DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_SprintReviews_Create
    @SprintId INT,
    @ReviewDate DATE,
    @CompletedWorkSummary VARCHAR(1000) = NULL,
    @Feedback VARCHAR(1000) = NULL,
    @ConductedByUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO SprintReviews
        (SprintId, ReviewDate, CompletedWorkSummary, Feedback, ConductedByUserId)
    OUTPUT INSERTED.SprintReviewId
    VALUES
        (@SprintId, @ReviewDate, @CompletedWorkSummary, @Feedback, @ConductedByUserId);
END
GO

CREATE OR ALTER PROCEDURE sp_Retrospectives_Create
    @SprintId INT,
    @RetroDate DATE,
    @WhatWentWell VARCHAR(1000) = NULL,
    @WhatToImprove VARCHAR(1000) = NULL,
    @ActionItems VARCHAR(1000) = NULL,
    @ConductedByUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO SprintRetrospectives
        (SprintId, RetroDate, WhatWentWell, WhatToImprove, ActionItems, ConductedByUserId)
    OUTPUT INSERTED.RetroId
    VALUES
        (@SprintId, @RetroDate, @WhatWentWell, @WhatToImprove, @ActionItems, @ConductedByUserId);
END
GO
