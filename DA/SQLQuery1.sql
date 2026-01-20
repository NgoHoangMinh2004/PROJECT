Create database EnglishLearningDB
use EnglishLearningDB

--Phân quyền người dùng
Create Table Roles(
	RoleID INT Identity Primary Key,
	RoleName Nvarchar(50) Not Null
);

Create Table AgeGroups(
	AgeGroupID Int Identity Primary Key,
	GroupName Nvarchar(50),
	MinAge INT,
	MaxAge INT
);

Create Table Levels(
	LevelID INT Identity Primary Key,
	LevelName Nvarchar(50),
	Descriptions Nvarchar(50)	
)

--Người Dùng
Create Table Users(
	UserID INT Identity Primary Key,
	FullName Nvarchar(100),
	Email Nvarchar(50),
	PasswordHash Nvarchar(255),
	RoleID INT,
	AgeGroupID INT,
	LevelID INT,
	CurrentDifficulty INT,
	IsActive Bit Default 1,
	CreatedAt DateTime Default GetDate(),
	Foreign Key (RoleID) References Roles(RoleID),
	Foreign Key (AgeGroupID) References AgeGroups(AgeGroupID),
	Foreign Key (LevelID) References Levels(LevelID)
);

--Bài test
Create Table PlacementTests(
	TestID INT Identity Primary Key,
	Title Nvarchar(100),
	Descriptions Nvarchar(Max)
);

--Kết quả test
Create Table PlacementTestResults(
	Result INT Identity Primary Key,
	UserID INT,
	TestID INT,
	Score Float,
	SuggestedDifficult INT, --AI de xuat dua tren ket qua
	TakenAT DateTime Default GetDate(),
	Foreign Key (UserID) References Users(UserID),
	Foreign Key (TestID) References PlacementTests(TestID)
);

--Độ Khó
Create Table Difficulties(
	DifficultyID INT Primary Key,
	Descriptions Nvarchar(25)
);

--Khoá học
Create Table Courses(
	CourseID INT Identity Primary Key,
	DifficultyID INT,
	CourseName Nvarchar(100),
	Descriptions Nvarchar(Max),
	Foreign Key (DifficultyID) References Difficulties(DifficultyID)
)

Create Table Lessons(
	LessonID INT Identity Primary Key,
	CourseID INT,
	Title Nvarchar(100),
	TheoryContent Nvarchar(MAX),
	LearningGoal Nvarchar(255),
	OrderIndex INT,
	Foreign Key (CourseID) References Courses(CourseID)
);

Create Table Exercise(
	ExerciseID INT Identity Primary Key,
	LessonID INT,
	ExerciseType Nvarchar(50), --Ngu phap,nghe,viet,doc
	Question Nvarchar(MAX),
	Foreign Key (LessonID) References Lessons(LessonID)
);

--Bai test vuot cap
Create Table DifficultyFinalTests(
	FinalTestID INT Identity Primary Key,
	DifficultyID INT,
	Title Nvarchar(100),
	PassScore Float,
	Foreign Key (DifficultyID) References Difficulties(DifficultyID)
);

Create Table FinalTestResults (
    ResultID INT Identity Primary Key,
    UserID INT,
    FinalTestID INT,

    Score Float,
    Passed BIT,
    TakenAt DateTime Default GETDATE(),

    Foreign Key (UserID) References Users(UserID),
    Foreign Key (FinalTestID) References DifficultyFinalTests(FinalTestID)
);

CREATE TABLE UserProgress (
    UserID INT,
    LessonID INT,
    Completed BIT DEFAULT 0,
    CompletedAt DATETIME,

    PRIMARY KEY (UserID, LessonID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (LessonID) REFERENCES Lessons(LessonID)
);

CREATE TABLE UserScores (
    UserID INT PRIMARY KEY,
    TotalScore INT DEFAULT 0,

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE AgentOutfits (
    OutfitID INT IDENTITY PRIMARY KEY,
    OutfitName NVARCHAR(100),
    RequiredScore INT
);

CREATE TABLE UserOutfits (
    UserID INT,
    OutfitID INT,
    UnlockedAt DATETIME DEFAULT GETDATE(),

    PRIMARY KEY (UserID, OutfitID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (OutfitID) REFERENCES AgentOutfits(OutfitID)
);
