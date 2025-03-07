import {errorHandler} from '../utils/error.js'
import { Puser } from '../models/user.model.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import bcryptjs from 'bcryptjs'

dotenv.config();

export const signupUser = async(req,res,next) =>{
    const {name,email,password,image} = req.body;

    if(name==="" || email==="" || password==="" || !name || !email || !password){
        return next(errorHandler(400,"Vous devez remplir tout les champs"))
    }

    try {
        let checkUser = await Puser.findOne({email:email}); //on cherche d'abord l'utilisateur dans la bdd si il existe
        if(checkUser){
            return next(errorHandler(400, 'Cet email est déjà utilisé dans un autre compte!'));
        }
     
        const passwordHashed = bcryptjs.hashSync(password, 10);
        const User = new Puser({
           name,
           email,
           password:passwordHashed,
           image
        })
        await User.save();
    
        const payload = { //dans ce token j'ai aussi ajouter isAdmin
            id:User._id,
        }
        const token = jwt.sign( payload, process.env.ACCESS_TOKEN,{expiresIn: '7d'}) 

        //Rechercher le user
        const userSaved = await Puser.findOne({ email });
        if(userSaved){
            const {password , ...rest} = userSaved._doc;
        
            res.status(200).cookie('user_access_token', token, { //je renvoi le token sous forme de cookie
            httpOnly:true,
            maxAge: 7*24*60*60*1000, //7jours
            secure: process.env.NODE_ENV === 'production', // Si en production, utiliser HTTPS
            sameSite: 'None', // Autoriser les cookies dans les requêtes cross-origin
            }).json(rest)   
        }
    } catch (error) {
        next(error)
    }

   
}

export const signinUser = async(req,res,next) =>{
    const {email,password} = req.body

    if(email==="" || password==="" || !email || !password){
        return next(errorHandler(400,"Vous devez remplir tout les champs pour vous connectez!"))
    }

    try {
        const checkUser = await Puser.findOne({email:email});
        if(checkUser){
            const checkPassword = bcryptjs.compareSync(password,checkUser.password);
            if(checkPassword){
                const payload = { id:checkUser._id };
                const token = jwt.sign( payload,process.env.ACCESS_TOKEN, {expiresIn:'7d'} );

                const {password, ...rest} = checkUser._doc;
    
                res.status(200).cookie('user_access_token' , token, {
                    httpOnly:true,
                    maxAge: 7*24*60*60*1000, //7jours
                    secure: process.env.NODE_ENV === 'production', // Si en production, utiliser HTTPS
                    sameSite: 'None', // Autoriser les cookies dans les requêtes cross-origin
                }).json(rest);
    
            }else{
                return next(errorHandler(401,"mot de passe incorrect!"))
            }
        }else{
            return next(errorHandler(404, "L'utilisateur n'existe pas!"))
        }
    } catch (error) {
        next(error)
    }
}

export const getAllUsers = async (req,res,next) =>{
    //Donc on va utilisé le systeme de requêtes pour pouvoir prendre les infos que vous voulons 
    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const limit = parseInt(req.query.limit) || 8;
        const sortDirection = req.query.order === 'asc' ? 1 : -1;

        const users = await Puser.find({ //on peut trouver des users à partir des diffentes moyens grâce aux requêtes
            ...(req.query.userId && {_id: req.query.userId}),
            ...(req.query.searchTerm && {  //ici la personne peut chercher un user grâce à seulement à des mots(phrases) contenu dans les postes
                $or: [
                    {name : {$regex: req.query.searchTerm, $options: 'i' }},
                    {email: {$regex: req.query.searchTerm, $options:'i' }},
                ],
            }),
        }).sort({ updatedAt: sortDirection }).skip(startIndex).limit(limit) //le sort représente l'ordre dans la quel on veut avoir le info

        res.status(200).json(users)
         
    } catch (error) {
        next(error);
    }
}

export const updateUser = async(req, res, next) =>{ //la fonction pour mettre à jour le user
    const {name,email,password,image} = req.body;
    let hashedPassword;

   if(req.user.id !== req.params.userId){
    return next(errorHandler(401, "Vous n'êtes pas autorisé à mettre à jour cet utilisateur!"))
   }

   if(password){ //vérification du password
    if(password.length < 6){
      return next(errorHandler(400, 'Le mot de passe doit avoir plus de 6 caractères'))
    }
     hashedPassword = bcryptjs.hashSync(password , 10); //je crypte le mot de passe
   }

   if(name){ //vérification du name
    if(name.length > 25){
        return next(errorHandler(400 , "le Nom d'utilisateur ne doit pas avoir plus de 25 carectères"));
    }
    if(name.includes(' ')){
        return next(errorHandler(400 , "le Nom d'utilisateur ne doit pas contenir des espaces"))
    }
    if(name !== name.toLowerCase()){
        return next(errorHandler(400 , "le Nom d'utilisateur ne doit pas contenir des caractères en majuscule"))
    }
    if(!name.match(/^[a-zA-Z0-9]+$/)){
        return next(errorHandler(400, "le Nom d'utilisateur doit seulement contenir des lettres et nombres"))
    }
   }

   try {
    await Puser.findByIdAndUpdate(req.params.userId , {
        $set:{
            name: name,
            email: email,
            password: hashedPassword,
            image: image,
        }},
        {new : true}
    );

    //Rechercher le user
    const userSaved = await Puser.findOne({_id:req.params.userId});
    if(userSaved){
        const {password , ...rest} = userSaved._doc;
        res.status(200).json(rest)
    }
   } catch (error) { next(error)}   
} 

export const deleteUser = async(req,res,next) =>{ //fonction pour supprimer un user
    if(req.user.id !== req.params.userId){
        return next(errorHandler(403, "Vous n'êtes pas permis à supprimer ce compte"))
    }

    try {
        await Puser.findByIdAndDelete(req.params.userId);
        res.status(200).clearCookie('user_access_token',{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Si en production, utiliser HTTPS
            sameSite: 'None', // Autoriser les cookies dans les requêtes cross-origin
        }).json('Utilisateur a été supprimer avec succée');
    } catch (error) { next(error) }
}

export const signOut = async(req,res,next) =>{ //pour la déconnection du user
    try {
        res.clearCookie('user_access_token',{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Si en production, utiliser HTTPS
            sameSite: 'None', // Autoriser les cookies dans les requêtes cross-origin
        }).status(200).json("L'utilisateur est déconnecté")
    } catch (error) { next(error) }
}
