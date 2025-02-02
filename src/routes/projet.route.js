import express from "express"
import { verifyToken } from "../utils/authVerify.js";
import { addProject,addMember,getTheProduct,updateProject,fetchAndGetProject } from "../controllers/projet.controller.js";

const router = express.Router();

router.post('/addProject',verifyToken,addProject);
router.post('/addMember/:projectId',verifyToken, addMember);

router.get(`/getTheProject/:projectId` , verifyToken, getTheProduct)
router.get('/fetchProject' , verifyToken, fetchAndGetProject)

router.put('/updateProject/:projectId' , verifyToken, updateProject)

export default router;