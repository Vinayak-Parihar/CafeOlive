import dotenv from "dotenv";
dotenv.config({ path: './.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const run = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/menu/list`);
        const data = await res.json();
        console.log("Success:", data.success);
        console.log("Items Count:", data.data.length);
        if (data.data.length > 0) {
            console.log("First Item:", JSON.stringify(data.data[0], null, 2));
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
};
run();
