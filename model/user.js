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
        },
        volatilityAltert: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model('User', userSchema)