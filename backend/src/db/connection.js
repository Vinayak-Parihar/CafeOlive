import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is not defined in environment variables");
        }
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}/${DB_NAME}`
        );
        console.log(`\n MongoDB connected! DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Mongo connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;