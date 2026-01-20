DROP DATABASE EnglishLearningDB
CREATE DATABASE EnglishLearningDB;
GO
USE EnglishLearningDB;
GO

-- ===============================
-- 2. Users
-- ===============================
CREATE TABLE Users (
    UserID INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    UserRole NVARCHAR(50) DEFAULT 'Student', -- Student / Admin
    Age INT,
    Level INT DEFAULT 1,                       -- 1: cơ bản, 2: trung, 3: nâng cao
    CurrentDifficulty INT DEFAULT 1,          -- Mức hiện tại
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- ===============================
-- 3. Difficulties (mức độ)
-- ===============================
CREATE TABLE Difficulties (
    DifficultyID INT IDENTITY PRIMARY KEY,
    Description NVARCHAR(255)
);

-- ===============================
-- 4. Courses
-- ===============================
CREATE TABLE Courses (
    CourseID INT IDENTITY PRIMARY KEY,
    DifficultyID INT NOT NULL,
    CourseName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    FOREIGN KEY (DifficultyID) REFERENCES Difficulties(DifficultyID)
);

-- ===============================
-- 5. Lessons
-- ===============================
CREATE TABLE Lessons (
    LessonID INT IDENTITY PRIMARY KEY,
    CourseID INT NOT NULL,
    Title NVARCHAR(100),
    TheoryContent NVARCHAR(MAX),
    LearningGoal NVARCHAR(255),
    OrderIndex INT,
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);
select*from Lessons
-- ===============================
-- 6. Exercises
-- ===============================
CREATE TABLE Exercises (
    ExerciseID INT IDENTITY PRIMARY KEY,
    LessonID INT NOT NULL,
    ExerciseType NVARCHAR(50), -- grammar, vocab, writing...
    Question NVARCHAR(MAX),
    FOREIGN KEY (LessonID) REFERENCES Lessons(LessonID)
);

-- ===============================
-- 7. LessonTests (bài kiểm tra cuối bài/mức)
-- ===============================
CREATE TABLE LessonTests (
    LessonTestID INT IDENTITY PRIMARY KEY,
    LessonID INT NOT NULL,
    DifficultyLevel INT NOT NULL, -- Mức độ bài test
    Title NVARCHAR(100),
    Description NVARCHAR(MAX),
    PassScore FLOAT,              -- Điểm cần đạt để unlock bài tiếp theo
    FOREIGN KEY (LessonID) REFERENCES Lessons(LessonID)
);

-- ===============================
-- 8. UserLessonProgress (tiến trình học)
-- ===============================
CREATE TABLE UserLessonProgress (
    UserID INT NOT NULL,
    LessonID INT NOT NULL,
    CurrentDifficulty INT NOT NULL,  -- lưu mức độ hiện tại
    Unlocked BIT DEFAULT 0,          -- 0: khóa, 1: mở
    PRIMARY KEY (UserID, LessonID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (LessonID) REFERENCES Lessons(LessonID)
);

select*from users