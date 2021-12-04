import mongoose from 'mongoose'

let userSchema = mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
        },
        watchlist: {
            type: Array,
            required: true
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model('User', userSchema)