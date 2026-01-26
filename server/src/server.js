const fs = require('fs');
const cors = require('cors');
const express = require('express');
const path = require('path');
require('dotenv').config();
const configViewEngine = require('./config/viewEngine');

// Import routes
const userRouter = require('./routes/user');
const courseRouter = require('./routes/courses');
const difRouter = require('./routes/difficulties');
const execRouter = require('./routes/exercises');
const lessonRoutes = require('./routes/lessons');
const progressRoutes = require('./routes/progress');
const testRoutes = require('./routes/test');
const dashboardRouter = require('./routes/dashboardRoutes');
const LearningRouter = require('./routes/learningRoutes');
const aiRouter = require('./routes/ai');

const app = express();

const port = 3000;
const hostname = 'localhost';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

configViewEngine(app);

app.use('/users', userRouter);
app.use('/courses', courseRouter);
app.use('/dif', difRouter);
app.use('/exe', execRouter);
app.use('/lessons', lessonRoutes);
app.use('/progress', progressRoutes);
app.use('/test', testRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/learning', LearningRouter);
app.use('/ai', aiRouter);

// Khởi chạy
app.listen(port, hostname, () => {
    console.log(`✅ Server đang chạy tại http://${hostname}:${port}`);
});