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

    const task = await Ptask.find({
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
            
            const taskesAssigned = await Ptask.find({projectId: {$in:projectIds}}); //je prends tout les tâches de ces Projets

            const totalTasks = await Ptask.countDocuments({projectId: {$in: projectIds}}) //je prends les totals des tâches de ces Projets
            const tasksByStatus = await Ptask.aggregate([ 
                {$match: { projectId : {$in:projectIds} } },
                {$group: {_id: "$status" , count: {$sum: 1} } }
             ])
            
            const taskStats = {
                total: totalTasks,
                aFaire: 0,
                EnCours: 0,
                Termine: 0
            }
            tasksByStatus.forEach(task =>{
                if(task._id === 'A faire'){ taskStats.aFaire = task.count; }
                if(task._id === 'En cours'){ taskStats.EnCours = task.count; }
                if(task._id === 'Terminé'){ taskStats.Termine = task.count; }
            })

            //prendre les tâches dont l'échéance est dans les 7 jours
            const today = new Date(); const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
            const tasksInLimit = await Ptask.find({projectId: {$in:projectIds},deadLine:{$lte:nextWeek}}).sort({deadLine:1})  //prendre les tâches dont le deadLine est <= 7 jours (qui arrivent bientôt à l'échéance ou en ratard)

            return res.status(200).json( {taskesAssigned,taskStats,tasksInLimit} )
        }
        
        return res.status(200).json([]) //si aucun projets n'a été trouvé
    }catch(error){ next(error) }
}

export const getTaskStates = async(req,res,next) =>{
    const userId = req.user.id;
    try {
        const projects = await Pproject.find({membres:userId});
        if(projects.length === 0) {
            return res.status(200).json({totalTasks:0, tasksByStatus:{}, tasksByMonth:[],completedTasksByProject:[]});
        }
        const projectIds = projects.map(projets => projets._id); //je prends les ids des projets que j'ai trouvé

        const tasksByStatus = await Ptask.aggregate([ //pour compter les tâches par status
            {$match: { projectId : {$in:projectIds} } },
            {$group: {_id: "$status" , count: {$sum: 1} } }
         ])

         //reformatter les données
         const taskStatusCount = {
            "A faire": 0,
            "En cours": 0,
            "Terminé": 0
        };
        tasksByStatus.forEach(task =>{
            taskStatusCount[task._id] = task.count;
        });

        //compter les tâches créées par mois
        const tasksByMonth = await Ptask.aggregate([ {$match: {projectId: {$in:projectIds}}},
            {$group: {_id: {$month: "$createdAt"}, count: {$sum:1}}}
         ]);


        //Compter les tâches terminé par projets
        const completedTasksByProject = await Ptask.aggregate([ {$match: {projectId: {$in:projectIds}, status:"Terminé" }},
            {$group: {_id:"$projectId", count:{$sum:1}}}
         ]).exec();
        const projectName = await Pproject.find({_id: {$in: completedTasksByProject.map((p)=> p._id ) }}).select("_id projectName");
        const taskWithNames = completedTasksByProject.map(task => {
            const project = projectName.find(p => p._id.equals(task._id)) //on regard si l'_id du "projectName" et égal à celle qu'on trouve dans "completedTasksByProject"
            return {projectName : project? project.projectName : "Projet inconnue", count: task.count } //et je retourne ça
        })


         res.status(200).json({
            totalTasks: taskStatusCount["A faire"] + taskStatusCount["En cours"] + taskStatusCount["Terminé"] /*total des tâches*/ ,
            tasksByStatus:taskStatusCount, //total tâches par status
            tasksByMonth,   
            completedTasksByProject: taskWithNames
         });

    } catch (error) {
        next(error)
    }
}