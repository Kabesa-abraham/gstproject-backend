import { Pproject } from "../models/project.model.js"
import { Puser } from '../models/user.model.js'
import {Ptask} from '../models/task.model.js'
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
export const deleteMember = async(req,res,next) =>{ //pour supprimer un membre dans un projet
    const projectId = req.params.projectId; //id du project
    const memberId = req.params.memberId;

    try {
        const updateProject = await Pproject.findByIdAndUpdate(projectId,{
                                    $pull:{membres: memberId}
                            },{new: true})
        if(updateProject){
            res.status(200).json("Le member est supprimé avec succée!")
        }
    }catch(err){next(err)}
}

export const getTheProduct = async(req,res,next) =>{
    const projectId = req.params.projectId;
    try {
        const theProject = await Pproject.findById({_id:projectId}).populate("createur membres", "_id name image");
        if(!theProject){
            return next(errorHandler(404, "Projet non trouvé"))
        }
        res.status(200).json(theProject);
    } catch (error) {
     next(error)   
    }
}

export const fetchAndGetProject = async(req,res,next)=>{
        const createurId = req.user.id;
    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 10; 
        const sortDirection = req.query.order === 'asc' ? 1 : -1;

        const project = await Pproject.find({ //projets que j'ai créé
                createur:createurId ,  //j'ai mis ça pour n'avoir que les project de ce user
            ...(req.query.projectId && {_id: req.query.projectId}),
            ...(req.query.searchTerm && {
                $or: [
                    {projectName : { $regex: req.query.searchTerm, $options: 'i' }}, //$options: 'i' on a mis ça pour ignorer la casse
                    {projectDescription: {$regex: req.query.searchTerm, $options:'i' }},
                ],
            }),
        }).sort({ updatedAt: sortDirection }).skip(startIndex).limit(limit).populate("createur membres", "name");

        const projectParticipated = await Pproject.find({ //projets dans le quel je participe
                membres:createurId ,
            ...(req.query.projectId && {_id: req.query.projectId}),
            ...(req.query.searchTerm && {
                $or: [
                    {projectName : { $regex: req.query.searchTerm, $options: 'i' }}, //$options: 'i' on a mis ça pour ignorer la casse
                    {projectDescription: {$regex: req.query.searchTerm, $options:'i' }},
                ],
            }),
        }).populate("createur membres", "name");

        const totalProjectsCreated = await Pproject.countDocuments({createur:createurId}); //total des projets que j'ai créé
        const totalProjectMembered = await Pproject.countDocuments({membres:createurId}); //total projects dont je suis membre

        res.status(200).json({ //et on renvoie tout ces données
            project,
            projectParticipated,
            totalProjectsCreated,
            totalProjectMembered
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

export const deleteTheProject = async(req,res,next) =>{
    const projectId = req.params.projectId
    try {
        const deleteTaskes = await Ptask.deleteMany({projectId:projectId})
        
        if(deleteTaskes){
            const deleteTheProject = await Pproject.findByIdAndDelete(projectId);
            if(deleteTheProject){
                res.status(200).json("Le Projet est supprimé avec succée!")
            }
        }
    } catch (error) {
        next(error)
    }
}


export const getAllUsersOfProjectsMember = async(req,res,next) =>{ //pour prendre tout les users des projets où je suis membre
    const userId = req.user.id;
    try {
        const projects = await Pproject.find({membres:userId}).populate("membres", "_id name email image") //Je prend les projets où je suis membre
        if(!projects || projects.length === 0){ res.status(200).json([]) } //si il n'ya pas ces projets

        let memberMap = new Map();
        projects.forEach((projet) => {
            projet.membres.forEach((member) =>{
               memberMap.set(member._id.toString(), member)
            })
        });
        const uniqueMembers = Array.from(memberMap.values()).filter(membre => membre._id.toString() !== userId)

        res.status(200).json(uniqueMembers) //je renvoie les membres unique
    } catch (error) {
        next(error)
    }
}