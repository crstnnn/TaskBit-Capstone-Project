/* ============================================================
   TaskBit Database Schema
   Web-Based Agile Collaboration and Task Load Monitoring Platform
   Target: Microsoft SQL Server (SSMS)
   ============================================================ */

CREATE DATABASE TaskBitDB;
GO

USE TaskBitDB;
GO

/* ---------------------------------------------------------
   1. Roles - system-level roles (Faculty, OrgOfficer, Member, Admin)
   --------------------------------------------------------- */
CREATE TABLE Roles (
    RoleId          INT IDENTITY(1,1) PRIMARY KEY,
    RoleName        VARCHAR(50) NOT NULL UNIQUE   -- Admin, Faculty, OrgOfficer, Member
);
GO

/* ---------------------------------------------------------
   2. Users
   --------------------------------------------------------- */
CREATE TABLE Users (
    UserId          INT IDENTITY(1,1) PRIMARY KEY,
    FullName        VARCHAR(150) NOT NULL,
    Email           VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash    VARCHAR(255) NOT NULL,
    RoleId          INT NOT NULL,
    IsActive        BIT NOT NULL DEFAULT 1,
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);
GO

/* ---------------------------------------------------------
   3. Projects (a capstone group / org activity / department project)
   --------------------------------------------------------- */
CREATE TABLE Projects (
    ProjectId       INT IDENTITY(1,1) PRIMARY KEY,
    ProjectName     VARCHAR(150) NOT NULL,
    Description     VARCHAR(1000) NULL,
    CreatedByUserId INT NOT NULL,
    Status          VARCHAR(20) NOT NULL DEFAULT 'Active',  -- Active, Archived
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Projects_Users FOREIGN KEY (CreatedByUserId) REFERENCES Users(UserId)
);
GO

/* ---------------------------------------------------------
   4. ProjectMembers - who belongs to which project, and their
      project-level role (TeamLead / Member)
   --------------------------------------------------------- */
CREATE TABLE ProjectMembers (
    ProjectMemberId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId       INT NOT NULL,
    UserId          INT NOT NULL,
    ProjectRole     VARCHAR(20) NOT NULL DEFAULT 'Member',  -- TeamLead, Member
    JoinedAt        DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_PM_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(ProjectId),
    CONSTRAINT FK_PM_Users FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT UQ_ProjectMember UNIQUE (ProjectId, UserId)
);
GO

/* ---------------------------------------------------------
   5. WorkloadLimits - configurable per project, used by the
      Task Load Checker
   --------------------------------------------------------- */
CREATE TABLE WorkloadLimits (
    WorkloadLimitId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId       INT NOT NULL UNIQUE,
    MaxActiveTasks  INT NOT NULL DEFAULT 5,
    MaxStoryPoints  INT NOT NULL DEFAULT 20,
    CONSTRAINT FK_WL_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(ProjectId)
);
GO

/* ---------------------------------------------------------
   6. Sprints
   --------------------------------------------------------- */
CREATE TABLE Sprints (
    SprintId        INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId       INT NOT NULL,
    SprintName      VARCHAR(100) NOT NULL,
    Goal            VARCHAR(500) NULL,
    StartDate       DATE NOT NULL,
    EndDate         DATE NOT NULL,
    Status          VARCHAR(20) NOT NULL DEFAULT 'Planned', -- Planned, Active, Completed
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Sprints_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(ProjectId),
    CONSTRAINT CK_Sprint_Dates CHECK (EndDate >= StartDate)
);
GO

/* ---------------------------------------------------------
   7. Tasks
      SprintId NULL  = still sitting in the Project Backlog
      SprintId set   = pulled into the Sprint Backlog
   --------------------------------------------------------- */
CREATE TABLE Tasks (
    TaskId              INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId           INT NOT NULL,
    SprintId            INT NULL,
    Title               VARCHAR(200) NOT NULL,
    Description         VARCHAR(1000) NULL,
    StoryPoints         INT NOT NULL DEFAULT 0,
    Priority            VARCHAR(20) NOT NULL DEFAULT 'Medium', -- Low, Medium, High, Critical
    Status              VARCHAR(20) NOT NULL DEFAULT 'ToDo',   -- ToDo, InProgress, Review, Done
    AssignedToUserId    INT NULL,
    CreatedByUserId     INT NOT NULL,
    DueDate             DATE NULL,
    CreatedAt           DATETIME NOT NULL DEFAULT GETDATE(),
    CompletedAt         DATETIME NULL,
    CONSTRAINT FK_Tasks_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(ProjectId),
    CONSTRAINT FK_Tasks_Sprints FOREIGN KEY (SprintId) REFERENCES Sprints(SprintId),
    CONSTRAINT FK_Tasks_AssignedTo FOREIGN KEY (AssignedToUserId) REFERENCES Users(UserId),
    CONSTRAINT FK_Tasks_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES Users(UserId)
);
GO

/* ---------------------------------------------------------
   8. TaskComments
   --------------------------------------------------------- */
CREATE TABLE TaskComments (
    CommentId       INT IDENTITY(1,1) PRIMARY KEY,
    TaskId          INT NOT NULL,
    UserId          INT NOT NULL,
    CommentText     VARCHAR(1000) NOT NULL,
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Comments_Tasks FOREIGN KEY (TaskId) REFERENCES Tasks(TaskId),
    CONSTRAINT FK_Comments_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

/* ---------------------------------------------------------
   9. DailyStandups (Daily Scrum ceremony)
   --------------------------------------------------------- */
CREATE TABLE DailyStandups (
    StandupId       INT IDENTITY(1,1) PRIMARY KEY,
    SprintId        INT NOT NULL,
    UserId          INT NOT NULL,
    StandupDate     DATE NOT NULL,
    YesterdayWork   VARCHAR(500) NULL,
    TodayPlan       VARCHAR(500) NULL,
    Blockers        VARCHAR(500) NULL,
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Standup_Sprints FOREIGN KEY (SprintId) REFERENCES Sprints(SprintId),
    CONSTRAINT FK_Standup_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

/* ---------------------------------------------------------
   10. SprintReviews (Sprint Review ceremony)
   --------------------------------------------------------- */
CREATE TABLE SprintReviews (
    SprintReviewId      INT IDENTITY(1,1) PRIMARY KEY,
    SprintId             INT NOT NULL UNIQUE,
    ReviewDate           DATE NOT NULL,
    CompletedWorkSummary VARCHAR(1000) NULL,
    Feedback              VARCHAR(1000) NULL,
    ConductedByUserId     INT NOT NULL,
    CONSTRAINT FK_Review_Sprints FOREIGN KEY (SprintId) REFERENCES Sprints(SprintId),
    CONSTRAINT FK_Review_Users FOREIGN KEY (ConductedByUserId) REFERENCES Users(UserId)
);
GO

/* ---------------------------------------------------------
   11. SprintRetrospectives (Sprint Retrospective ceremony)
   --------------------------------------------------------- */
CREATE TABLE SprintRetrospectives (
    RetroId             INT IDENTITY(1,1) PRIMARY KEY,
    SprintId            INT NOT NULL UNIQUE,
    RetroDate           DATE NOT NULL,
    WhatWentWell        VARCHAR(1000) NULL,
    WhatToImprove       VARCHAR(1000) NULL,
    ActionItems         VARCHAR(1000) NULL,
    ConductedByUserId   INT NOT NULL,
    CONSTRAINT FK_Retro_Sprints FOREIGN KEY (SprintId) REFERENCES Sprints(SprintId),
    CONSTRAINT FK_Retro_Users FOREIGN KEY (ConductedByUserId) REFERENCES Users(UserId)
);
GO

/* ---------------------------------------------------------
   12. ActivityLogs - audit trail / reporting source
   --------------------------------------------------------- */
CREATE TABLE ActivityLogs (
    LogId           INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT NOT NULL,
    ActionType      VARCHAR(50) NOT NULL,   -- e.g. TaskCreated, TaskAssigned, TaskCompleted
    EntityType      VARCHAR(50) NOT NULL,   -- Task, Sprint, Project
    EntityId        INT NOT NULL,
    Description     VARCHAR(500) NULL,
    Timestamp       DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Logs_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

/* ---------------------------------------------------------
   Seed data
   --------------------------------------------------------- */
INSERT INTO Roles (RoleName) VALUES ('Admin'), ('Faculty'), ('OrgOfficer'), ('Member');
GO

/* ---------------------------------------------------------
   Helpful indexes for the Task Load Checker & dashboards
   --------------------------------------------------------- */
CREATE INDEX IX_Tasks_AssignedTo_Status ON Tasks(AssignedToUserId, Status);
CREATE INDEX IX_Tasks_Project_Sprint ON Tasks(ProjectId, SprintId);
GO
