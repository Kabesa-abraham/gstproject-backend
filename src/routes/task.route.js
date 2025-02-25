import express from 'express';
import {verifyToken} from '../utils/authVerify.js'
import { createTask,fetchTaskAndGet, fetchTaskesForProject, fetchTheTask,updateTheTask,deleteTask,
         fetchTaskforProjectsMember,fetchTaskesForProjectWithoutLimit,getTaskStates
       } from '../controllers/task.controller.js';

const router = express.Router();

router.post('/createTask' , verifyToken, createTask);

router.get('/fetchTaskAndGet' ,verifyToken, fetchTaskAndGet )
router.get('/fetchTaskesForProject' ,verifyToken, fetchTaskesForProject )
router.get('/fetchTaskesForProjectWithoutLimit/:projectId' ,verifyToken, fetchTaskesForProjectWithoutLimit )
router.get('/fetchTheTask/:tacheId' , verifyToken , fetchTheTask)
router.get('/fetchTaskforProjectsMember', verifyToken, fetchTaskforProjectsMember )

router.put('/updateTask/:taskId' , verifyToken , updateTheTask)
router.delete('/deleteTask/:taskId', verifyToken, deleteTask);

router.get('/tasksStats', verifyToken , getTaskStates)

export default router;