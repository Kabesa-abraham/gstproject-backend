import mongoose from 'mongoose'

const PprojectSchema = mongoose.Schema({
    projectName:{
        type:String,
        required:true
    },
    projectDescription:{
        type:String,
    },
    createur:{
        type:String,
        required:true
    },
    membres:{
        type:Array
    }
},{timestamps:true}
)

export const Pproject = mongoose.model('Pproject',PprojectSchema);