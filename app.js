import express from 'express'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookie_parser from 'cookie-parser'
import uploadRoute from './src/routes/upload.route.js';
import userRoute from './src/routes/user.route.js';
import projetRoute from './src/routes/projet.route.js';
import taskRoute from './src/routes/task.route.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URL).then(() => {console.log('MongoDB connected')})
                                       .catch((err) => console.log(err));

const app = express()
app.use(
    cors({
      origin: ["http://localhost:5173", "https://oragon.vercel.app"],
      credentials: true, // Permet d'envoyer les cookies si nécessaire
      methods: ["GET", "POST", "PUT", "DELETE"], // Autorise ces méthodes HTTP
      allowedHeaders: ["Content-Type", "Authorization","Accept"], // Autorise ces headers
    })
  );

app.use(cookie_parser());

app.use('/backend/upload', uploadRoute);
app.use('/backend/auth', userRoute);
app.use('/backend/projet', projetRoute);
app.use('/backend/task', taskRoute);

app.use((err,req,res,next) => {  //ceci est un middleware qui va me permettre des faire la gestion des erreurs dans mes codes
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error'
    res.status(statusCode).json({
        success:false,
        statusCode,
        message
    })
})

const PORT = process.env.PORT;

app.listen(PORT, ()=>{
    console.log(`Serveur en cours d'éxecution on port ${PORT}`)
})
