import mongoose from 'mongoose'

const PtaskSchema = mongoose.Schema({
    taskName:{
        type:String,
        required:true
    },
    taskDescription:{
        type:String,
    },
    status:{
        type:String,
        enum: ["A faire" , "En cours", "Terminé"],
        default:'A faire'
    },
    assigneA:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Puser",
        required:true
    },
    projectId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Pproject",
        required:true
    },
    deadLine:{
        type:Date,
        default:new Date().getDate()
    },
},{timestamps:true}
)

export const Ptask = mongoose.model('Ptask', PtaskSchema);