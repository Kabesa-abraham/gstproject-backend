import { Pproject } from "../models/project.model.js"
import { Puser } from '../models/user.model.js'
import { errorHandler } from "../utils/error.js"

export const addProject = async(req,res,next) =>{
    const {projectName,projectDescription} = req.body
    const createurId = req.user.id; //je prend l'id du créateur grâce au middleware

    if(projectName==="" || !projectName){
        return errorHandler(400, "Le nom du projet est obligatoire");
    }

    try {
        const newProject = new Pproject({
            projectName:projectName,
            projectDescription:projectDescription,
            createur:createurId,
            membres: [createurId] //le créateur est aussi le prémier membre du projet
        })
        await newProject.save();

        res.status(200).json("Projet crée avec succée");

    } catch (error) {
       next(error) 
    }
}

export const addMember = async(req,res,next) =>{
    const {email} = req.body; //l'email de la personne à ajouter
    const projectId = req.params.projectId; //id du project

    try {
        const theProject = await Pproject.findOne({_id:projectId})
        if(!theProject){ //vérifier si le projet existe
            return next(errorHandler(404, "le projet n'existe pas"));
        }
        if(theProject.createur.toString() !== req.user.id){ //on vérifie l'id du createur du projet si il correspond à celle du middleware
            return next(errorHandler(400,"Celle le propriétaire du projet peut ajouter des membres"));
        }

        const newMember = await Puser.findOne({email:email}); //trouvez le user grâce à son email
        if(!newMember){ // on vérifie si l'utilisateur qui veut être membre existe
            return next(errorHandler(404, "L'utilisateur n'existe pas"));
        }

        if(theProject.membres.includes(newMember._id)){ //on vérifie si le user existe déjà dans le project
            return next(errorHandler(400 ,'cet utilisateur est déjà inclue dans le Projet'));
        }

        //Ajoutons maintenant le user dans le projet comme nouveau membre
        theProject.membres.push(newMember._id);
        await theProject.save();

        res.status(200).json("Nouveau membre ajouté avec succée")

    } catch (error) {
        next(error)
    }
}

export const getTheProduct = async(req,res,next) =>{
    const projectId = req.params.projectId;
    try {
        const theProject = await Pproject.findById({_id:projectId}).populate("createur membres", "name image");
        if(!theProject){
            return next(errorHandler(404, "Projet non trouvé"))
        }
        res.status(200).json(theProject);
    } catch (error) {
     next(error)   
    }
}

export const fetchAndGetProject = async(req,res,next)=>{
        const createurId = req.user.id
    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 10; 
        const sortDirection = req.query.order === 'asc' ? 1 : -1;

        const project = await Pproject.find({ 
                createur:createurId,  //j'ai mis ça pour n'avoir que les project de ce user
            ...(req.query.projectId && {_id: req.query.projectId}),
            ...(req.query.searchTerm && {
                $or: [
                    {projectName : { $regex: req.query.searchTerm, $options: 'i' }}, //$options: 'i' on a mis ça pour ignorer la casse
                    {projectDescription: {$regex: req.query.searchTerm, $options:'i' }},
                ],
            }),
        }).sort({ updatedAt: sortDirection }).skip(startIndex).limit(limit).populate("createur membres", "name");

        const totalProjects = await Pproject.estimatedDocumentCount();

        const now = new Date();
        const oneMonthAgo = new Date(
            now.getFullYear(),
            now.getMonth() -1,
            now.getDate(), 
        );
        const lastMonthProjects = await Pproject.countDocuments({ //pour prendre le nombre de postes mais seulement du mois dernière
            createdAt: {$gte: oneMonthAgo}
        });

        res.status(200).json({ //et on renvoie tout ces données
            project,
            totalProjects,
            lastMonthProjects
        })
         
    } catch (error) {
        next(error);
    }
}

export const updateProject = async(req,res,next) =>{
    const { projectName,projectDescription } = req.body;
    try {
        await Pproject.findByIdAndUpdate(
                                 req.params.projectId,
                                 {
                                  $set:{
                                    projectName:projectName,
                                    projectDescription:projectDescription
                                  } },
                                  {new: true}
        )
        res.status(200).json("Projet mis à jour avec succée")
    } catch (error) {
        next(error)
    }
}