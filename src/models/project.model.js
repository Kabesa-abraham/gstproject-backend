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
        type:mongoose.Schema.Types.ObjectId,
        ref:"Puser",
        required:true
    },
    membres:{
        type:[{type:mongoose.Schema.Types.ObjectId , ref:"Puser"}]
    }
},{timestamps:true}
)

export const Pproject = mongoose.model('Pproject',PprojectSchema);