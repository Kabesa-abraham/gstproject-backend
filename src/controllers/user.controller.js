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
            httpOnly:false,
            maxAge: 7*24*60*60*1000 //7jours
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
                    httpOnly:false,
                    maxAge: 7*24*60*60*1000 //7jours
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