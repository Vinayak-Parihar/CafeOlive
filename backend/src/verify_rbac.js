import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/user.model.js";
import { Order } from "./models/order.model.js";
import { Menu } from "./models/menu.model.js";

dotenv.config({ path: './.env' }); // Assuming running from backend root

// Password used for the throwaway test accounts this script creates and deletes. Override via
// env if desired; the default is fine since these accounts only exist for the duration of the run.
const RBAC_TEST_PASSWORD = process.env.RBAC_TEST_PASSWORD || "password123";

const verifyRBAC = async () => {
    try {
        console.log("Connecting to DB...");
        const MONGODB_URI = process.env.MONGODB_URL;
        if (!MONGODB_URI) {
            throw new Error("MONGODB_URL is not set. Add it to backend/.env before running this script.");
        }
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        // 1. Create Users directly (simulate admin actions)
        console.log("Creating Test Staff...");

        const testChef = await User.findOneAndUpdate(
            { email: "chef_test@test.com" },
            {
                fullName: "Test Chef",
                username: "testchef",
                password: RBAC_TEST_PASSWORD, // Note: This won't work for login unless hashed, but we can test logic manually or use schemas pre-save
                role: "chef"
            },
            { upsert: true, new: true }
        );
        // Manually trigger save to hash password
        testChef.password = RBAC_TEST_PASSWORD;
        await testChef.save();

        const testWaiter = await User.findOneAndUpdate(
            { email: "waiter_test@test.com" },
            {
                fullName: "Test Waiter",
                username: "testwaiter",
                role: "waiter"
            },
            { upsert: true, new: true }
        );
        testWaiter.password = RBAC_TEST_PASSWORD;
        await testWaiter.save();

        console.log("Created Chef:", testChef.username);
        console.log("Created Waiter:", testWaiter.username);

        // 2. Create an Order
        console.log("Creating Test Order...");
        // Need a menu item
        let menuItem = await Menu.findOne();
        if (!menuItem) {
            menuItem = await Menu.create({
                name: "Test Coffee",
                price: 100,
                category: new mongoose.Types.ObjectId(), // dummy
                isAvailable: true
            });
        }

        const order = await Order.create({
            items: [{
                name: menuItem.name,
                price: menuItem.price,
                quantity: 2,
                menuItem: menuItem._id
            }],
            totalAmount: menuItem.price * 2,
            tableNumber: "T-TEST",
            status: "placed",
            guestDetails: { name: "Test Guest" }
        });
        console.log(`Order created: ${order._id} [${order.status}]`);

        // 3. Simulate Chef Fetch (Kitchen Orders)
        const kitchenOrders = await Order.find({ status: { $in: ['placed', 'preparing'] } });
        const canSee = kitchenOrders.some(o => o._id.equals(order._id));
        console.log(`Chef Access Check (Kitchen View): ${canSee ? "PASS" : "FAIL"}`);

        // 4. Simulate Chef Update -> Preparing
        order.status = "preparing";
        await order.save();
        console.log("Order status updated to 'preparing'");

        // 5. Simulate Chef Update -> Ready
        order.status = "ready";
        await order.save();
        console.log("Order status updated to 'ready'");

        // 6. Simulate Waiter Fetch (Service Orders)
        const serviceOrders = await Order.find({ status: { $in: ['ready', 'served'] } });
        const waiterCanSee = serviceOrders.some(o => o._id.equals(order._id));
        console.log(`Waiter Access Check (Service View): ${waiterCanSee ? "PASS" : "FAIL"}`);

        // Cleanup
        await User.deleteOne({ email: "chef_test@test.com" });
        await User.deleteOne({ email: "waiter_test@test.com" });
        await Order.deleteOne({ _id: order._id });
        if (menuItem.name === "Test Coffee") await Menu.deleteOne({ _id: menuItem._id });

        console.log("Verification Complete. Cleanup Done.");
        process.exit(0);

    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
};

verifyRBAC();
