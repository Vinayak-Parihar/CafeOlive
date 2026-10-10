import mongoose from "mongoose";
//const { Schema } = mongoose;
import { Schema } from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true

        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        photo: {
            type: String, //cloudinary url
        },
        role: {
            type: String,
            enum: ['admin', 'manager', 'chef', 'waiter', 'customer'],
            required: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, 'password is required']
        },
        refreshtoken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.plugin(mongoosePaginate)

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)