import mongoose from 'mongoose'

const PuserSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required: true
    },
    password:{
        type:String,
        required:true
     },
    image:{
        type:String,
     }

},{timestamps: true}
)

export const Puser = mongoose.model('Puser', PuserSchema);