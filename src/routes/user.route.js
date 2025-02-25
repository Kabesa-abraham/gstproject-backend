import express from 'express'
import { signinUser, signupUser,getAllUsers, updateUser, deleteUser, signOut } from '../controllers/user.controller.js';
import { verifyToken } from '../utils/authVerify.js';

const router = express.Router();

router.post('/signup', signupUser);
router.post('/signin', signinUser);
router.get('/allUser', verifyToken , getAllUsers)

router.put('/updateUser/:userId', verifyToken , updateUser)
router.delete('/deleteUser/:userId', verifyToken, deleteUser)
router.post('/signout', verifyToken, signOut)

export default router