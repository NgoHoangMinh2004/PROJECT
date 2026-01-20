const express = require('express');
const router = express.Router();
const { getCourses, addCourse, getCourseById, editCourse, delCourse } = require('../controllers/CoursesController')

router.get('/', getCourses);
router.post('/add', addCourse);
router.get('/edit/:CourseID', getCourseById);
router.post('/edit/:CourseID', editCourse);
router.delete('/delete/:CourseID', delCourse)

module.exports = router;
