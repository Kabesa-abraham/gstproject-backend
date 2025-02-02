import express from 'express'
import { signinUser, signupUser,getAllUsers } from '../controllers/user.controller.js';
import { verifyToken } from '../utils/authVerify.js';

const router = express.Router();

router.post('/signup', signupUser);
router.post('/signin', signinUser);
router.get('/allUser', verifyToken , getAllUsers)

export default router