import { Pproject } from "../models/project.model.js";
import { Ptask } from "../models/task.model.js"
import { errorHandler } from "../utils/error.js"

export const createTask = async(req,res,next) =>{
    const {taskName,taskDescription,status,projectId,deadLine} = req.body;
    const userId = req.user.id;

    if(!taskName || taskName===""){
        return next(errorHandler(400, "Le champ Nom du tâche est obligatoire"))
    }
    if(!projectId || projectId===""){
        return next(errorHandler(400, "Vous devez inscrire le projet assigné à cette tâche"))
    }

    try {

        const newTask = new Ptask({
            taskName:taskName,
            taskDescription:taskDescription,
            status:status,
            assigneA:userId,
            projectId:projectId,
            deadLine:deadLine
        })
        await newTask.save();

        res.status(200).json("Tâche crée avec succée")  
    } catch (error) {
        next(error)
    }
}

export const fetchTaskAndGet = async(req,res,next)=>{
    const createurId = req.user.id
try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 10; 
    const sortDirection = req.query.order === 'asc' ? 1 : -1;

    const task = await Ptask.find({                             // je doit modifier la partie de postPage car ce là où j'avais fetch pour prendre les taskes d'un projet 
            assigneA:createurId,  //j'ai mis ça pour n'avoir que les taskes de ce user
        ...(req.query.status && {status: req.query.status}),
        ...(req.query.projectId && {projectId: req.query.projectId}),
        ...(req.query.searchTerm && {
            $or: [
                {taskName : { $regex: req.query.searchTerm, $options: 'i' }}, //$options: 'i' on a mis ça pour ignorer la casse
                {taskDescription: {$regex: req.query.searchTerm, $options:'i' }},
            ],
        }),
    }).sort({ updatedAt: sortDirection }).skip(startIndex).limit(limit).populate("assigneA", "name email").populate("projectId", "projectName");

    res.status(200).json({
        task
    })
     
} catch (error) {
    next(error);
}}

export const fetchTheTask = async (req,res,next) =>{ //pour prendre les données d'une tâche
    const taskId = req.params.tacheId
    try {
       const theTask = await Ptask.findById({_id:taskId}).populate("projectId", "projectName").populate("assigneA","name image");
       res.status(200).json(theTask) 
    } catch (error) {
        next(error)
    }
}

export const fetchTaskesForProject = async(req,res,next)=>{
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 10; 
    const sortDirection = req.query.order === 'asc' ? 1 : -1;
    try {
        const taskesWithOutAssigneA = await Ptask.find(
            {projectId:req.query.projectId}
        ).sort({ updatedAt: sortDirection }).skip(startIndex).limit(limit);
    
        res.status(200).json({
            taskesWithOutAssigneA
        })
    } catch (error) {
        next(error)
    }
}

export const fetchTaskesForProjectWithoutLimit = async(req,res,next)=>{ //sans limit
    try {
        const taskes = await Ptask.find({projectId:req.params.projectId});
        res.status(200).json(taskes);
    } catch (error) {
        next(error)
    }
}

export const updateTheTask = async(req,res,next) =>{
    const {taskName,taskDescription,status,projectId,deadLine} = req.body
    const taskId = req.params.taskId;
    try {
       const updatedTask = await Ptask.findByIdAndUpdate({_id:taskId},{
                            $set:{
                                taskName,taskDescription,status,projectId,deadLine
                            }},
                            {new:true});
        if(updatedTask){
            res.status(200).json("Tâche mis à jour avec succée")
        }
    } catch (error) {
        next(error)
    }
}

export const deleteTask = async(req,res,next) =>{
    const taskId = req.params.taskId;
    try {
        const deletedTask = await Ptask.findByIdAndDelete({_id:taskId});
        if(deletedTask){
            res.status(200).json("Tâche supprimé avec succée");
        }
    } catch (error) {
        next(error)
    }
}

export const fetchTaskforProjectsMember = async(req,res,next) =>{
    const userId = req.user.id
    try {
        const projects = await Pproject.find({membres:userId});
        if(projects.length > 0){
            const projectIds = projects.map(thoseProjects => thoseProjects._id) //je prends les ids de ces projects 
            
            const taskesAssigned = await Ptask.find({projectId: {$in:projectIds}});
            return res.status(200).json( taskesAssigned )
        }
        return res.status(200).json([]) //si aucun projets n'a été trouvé
    }catch(error){ next(error) }
}