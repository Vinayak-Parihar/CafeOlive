import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { User } from "./models/user.model.js";

dotenv.config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URL;

// Seed admin identity — override via env vars; these are fallback defaults for local dev only.
const SEED_ADMIN_FULLNAME = process.env.SEED_ADMIN_FULLNAME || "Super Admin";
const SEED_ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || "super_admin";
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "super@oliv.com";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";
const SEED_ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || "9999999999";

const seedAdmin = async () => {
    try {
        if (!MONGODB_URI) {
            throw new Error("MONGODB_URL is not set. Add it to backend/.env before running this script.");
        }

        // 1. डेटाबेस कनेक्ट करा
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Database connected successfully!");

        // 2. जुना ॲडमिन असेल तर चेक करा (Optional)
        const existingAdmin = await User.findOne({ email: SEED_ADMIN_EMAIL });
        if (existingAdmin) {
            console.log("⚠️ Admin already exists!");
            process.exit(0);
        }

        // 3. (Removed manual hashing)

        // 4. नवीन ॲडमिन बनवा (Simple Mongoose query)
        const newAdmin = await User.create({
            fullName: SEED_ADMIN_FULLNAME,
            username: SEED_ADMIN_USERNAME,
            email: SEED_ADMIN_EMAIL,
            password: SEED_ADMIN_PASSWORD,
            role: "admin",
            phone: SEED_ADMIN_PHONE,
            // जर profilePhoto required असेल तर खालील ओळ अनकमेंट करा:
            // profilePhoto: "https://example.com/default-avatar.png"
        });

        console.log("🎉 Admin created successfully!");
        console.log("Email:", SEED_ADMIN_EMAIL);
        console.log("Password:", SEED_ADMIN_PASSWORD);

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        // 5. काम झाल्यावर कनेक्शन बंद करा
        await mongoose.connection.close();
        process.exit(0);
    }
};

seedAdmin();