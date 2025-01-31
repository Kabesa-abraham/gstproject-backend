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
        required:true,
        default:'En cours'
    },
    deadLine:{
        type:Date,
    },
    project:{
        type:String,
        required:true
    },
    assigneA:{
        type:String,
        required:true
    }
},{timestamps:true}
)

export const Ptask = mongoose.model('Ptask', PtaskSchema);