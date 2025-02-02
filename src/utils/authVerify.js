import jwt from 'jsonwebtoken';
import {errorHandler} from './error.js';

export const verifyToken = (req, res, next) =>{ //ce middleware va me permettre de vérifier le token qui a été générer lors du auth du user
    const token = req.cookies.user_access_token; //grâce à cookie-parser j'accède au token qui est dans le navigateur
    if(!token){
        return next(errorHandler(401, 'Unauthorized'));
    }
    jwt.verify(token , process.env.ACCESS_TOKEN , (err,user) =>{
        if(err){
            return next(errorHandler(401, 'Unauthorized to do the action'))
        }
        req.user = user; //donc après vérification le user sera ajouté dans le request
        next();
    })
}