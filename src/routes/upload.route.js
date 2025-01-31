import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors'

const router = express.Router();
router.use(cors());

const Storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req,file,cb) =>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:Storage})

router.post('/upload_image', upload.single('image') , (req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${4000}/images/${req.file.filename}`
    })
})

export default router;

