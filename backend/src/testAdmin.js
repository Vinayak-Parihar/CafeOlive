import dotenv from "dotenv";
dotenv.config({ path: './.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
const DEBUG_ADMIN_USERNAME = process.env.DEBUG_ADMIN_USERNAME || 'admin_oliv';
const DEBUG_ADMIN_PASSWORD = process.env.DEBUG_ADMIN_PASSWORD || 'admin123';

const run = async () => {
    try {
        // 1. Login
        console.log("Logging in as Admin...");
        const loginRes = await fetch(`${API_BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: DEBUG_ADMIN_USERNAME,
                password: DEBUG_ADMIN_PASSWORD
            })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            throw new Error(loginData.message || "Login Failed");
        }

        const { accessToken } = loginData.data;
        console.log("Login Successful. Token:", accessToken.substring(0, 20) + "...");

        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };

        // 2. Get Stats
        console.log("\nFetching Stats...");
        const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers });
        const statsData = await statsRes.json();

        if (statsRes.ok) {
            console.log("Stats Response:", JSON.stringify(statsData.data, null, 2));
        } else {
            console.error("Stats Failed:", statsData);
        }

        // 3. Get Pending Orders
        console.log("\nFetching Pending Orders...");
        const pendingRes = await fetch(`${API_BASE_URL}/api/admin/pending-orders`, { headers });
        const pendingData = await pendingRes.json();

        if (pendingRes.ok) {
            console.log("Pending Orders Count:", pendingData.data.length);
        } else {
            console.error("Pending Orders Failed:", pendingData);
        }

    } catch (err) {
        console.error("Critical Error:", err.message);
    }
};

run();
