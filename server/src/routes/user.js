const express = require('express');
const router = express.Router();
const { getUsersPage, addUser, getEditUserpage, editUser, delUser, login, register, updateProfileAfterTest } = require('../controllers/userController')
const verifyToken = require('../middleware/auth');

router.get('/', getUsersPage);
router.post('/login', login);
router.post('/add', addUser);
router.get('/edit/:UserID', getEditUserpage);
router.post('/edit/:UserID', editUser);
router.delete('/delete/:UserID', delUser);
router.post('/register', register);
router.post('/update-profile', verifyToken, updateProfileAfterTest);

module.exports = router;
