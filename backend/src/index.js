import dotenv from "dotenv";
//dotenv.config()
dotenv.config({ path: './.env' })
import app from "./app.js";
import connectionDB from "./db/connection.js";

const PORT = process.env.PORT || 4000
connectionDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running at port: ${PORT}`);
        })
    })
    .catch((err) => {
        console.log("Server startup failed ", err);
    })