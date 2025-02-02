import express from 'express'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http'; //nécessaire pour socket.io
import {Server} from 'socket.io';
import cors from 'cors';
import cookie_parser from 'cookie-parser'
import uploadRoute from './src/routes/upload.route.js';
import userRoute from './src/routes/user.route.js';
import projetRoute from './src/routes/projet.route.js'

dotenv.config();

mongoose.connect(process.env.MONGO_URL).then(() => {console.log('MongoDB connected')})
                                       .catch((err) => console.log(err));

const app = express();
const server = http.createServer(app); //créer un serveur http
const io = new Server(server)

app.use(cors());
app.use(express.json());
app.use(cookie_parser());

app.use('/backend/upload', uploadRoute);
app.use('/backend/auth', userRoute);
app.use('/backend/projet', projetRoute);

app.use('/images' , express.static('upload/images'))

server.listen(4000, ()=>{
    console.log("Serveur Websocket et API en cours d'éxecution on port 4000")
})

app.use((err,req,res,next) => {  //ceci est un middleware qui va me permettre des faire la gestion des erreurs dans mes codes
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error'
    res.status(statusCode).json({
        success:false,
        statusCode,
        message
    })
})