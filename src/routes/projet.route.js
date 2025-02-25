import express from "express"
import { verifyToken } from "../utils/authVerify.js";
import { addProject,addMember,getTheProduct,updateProject,fetchAndGetProject,deleteTheProject, getAllUsersOfProjectsMember, deleteMember } from "../controllers/projet.controller.js";

const router = express.Router();

router.post('/addProject',verifyToken,addProject);
router.post('/addMember/:projectId',verifyToken, addMember);
router.post('/deleteMember/:projectId/:memberId',verifyToken,deleteMember)

router.get(`/getTheProject/:projectId` , verifyToken, getTheProduct)
router.get('/fetchProject' , verifyToken, fetchAndGetProject)

router.put('/updateProject/:projectId' , verifyToken, updateProject)
router.delete('/deleteProject/:projectId' , verifyToken , deleteTheProject )

router.get('/getAllUsersOfProjectsMember', verifyToken,getAllUsersOfProjectsMember);

export default router;