import mongoose from 'mongoose'


let alertSchema = mongoose.Schema(
    {
        alertType: {
            type: String,
            required: true
        },
        value: {
            type: Number,
            required: true
        },
        direction: {
            type: String,
            enum: ['above', 'below'],
            required: true
        },
        userId: {
            type: String,
            required: true
        },
        coinId: {
            type: String, 
            required: true
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model('Alert', alertSchema)