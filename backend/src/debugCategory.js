import dotenv from "dotenv";
dotenv.config({ path: './.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const DEBUG_ADMIN_USERNAME = process.env.DEBUG_ADMIN_USERNAME || 'admin_oliv';
const DEBUG_ADMIN_PASSWORD = process.env.DEBUG_ADMIN_PASSWORD || 'admin123';

const run = async () => {
    try {
        console.log("1. Logging in...");
        const loginRes = await fetch(`${API_BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: DEBUG_ADMIN_USERNAME,
                password: DEBUG_ADMIN_PASSWORD
            })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error("Login Failed: " + JSON.stringify(loginData));

        const token = loginData.data?.accessToken;
        console.log("Login OK. User Role:", loginData.data?.user?.role);

        console.log("2. Adding Category 'Test Category'...");
        const catRes = await fetch(`${API_BASE_URL}/api/menu/category`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'Test Category' })
        });

        const catData = await catRes.json();
        console.log("Status:", catRes.status);
        console.log("Response:", JSON.stringify(catData, null, 2));

    } catch (e) {
        console.error("Error:", e.message);
        if (e.cause) console.error("Cause:", e.cause);
    }
};

run();
