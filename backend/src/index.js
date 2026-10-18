import "dotenv/config";
import app from "./app.js";
import connectionDB from "./db/connection.js";

// Validate critical environment variables
const REQUIRED_ENV_VARS = ["MONGODB_URL", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
    console.error(`❌ Critical Error: Missing required environment variables: ${missingVars.join(", ")}`);
    process.exit(1);
}

const PORT = process.env.PORT || 3000;
connectionDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running at port: ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Server startup failed:", err);
    });