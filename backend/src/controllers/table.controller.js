import QRCode from "qrcode";
import crypto from "crypto";
import os from "os";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Table } from "../models/table.model.js";
import { TableSession } from "../models/tableSession.model.js";
import { Order } from "../models/order.model.js";

// Helper: Determine local LAN IPv4 address (e.g. 192.168.1.34)
const getLocalLanIp = () => {
    const interfaces = os.networkInterfaces();
    // Prioritize Wi-Fi or Ethernet over virtual adapters (VMware, Docker, etc.)
    for (const name of Object.keys(interfaces)) {
        if (/vmware|virtual|loopback|vethernet/i.test(name)) continue;
        for (const iface of interfaces[name] || []) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
};

// Helper: Determine client base URL for generating QR Code destination
const getClientBaseUrl = (req) => {
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
        try {
            const parsed = new URL(origin);
            if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
                const lanIp = getLocalLanIp();
                return `${parsed.protocol}//${lanIp}${parsed.port ? `:${parsed.port}` : ""}`;
            }
            return `${parsed.protocol}//${parsed.host}`;
        } catch {
            // ignore invalid URL
        }
    }
    const lanIp = getLocalLanIp();
    return process.env.CLIENT_URL || `http://${lanIp}:5173`;
};

// Helper: Generate QR Code data URL
const generateTableQrDataUrl = async (tableNumber, baseUrl) => {
    const scanUrl = `${baseUrl.replace(/\/$/, "")}/scan?table=${encodeURIComponent(tableNumber)}`;
    return await QRCode.toDataURL(scanUrl, {
        errorCorrectionLevel: "H",
        type: "image/png",
        margin: 2,
        scale: 8,
        color: {
            dark: "#1e2a1b",
            light: "#ffffff"
        }
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Get All Tables (Admin & All Staff: Manager, Chef, Waiter, Cashier)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTables = asyncHandler(async (req, res) => {
    const tables = await Table.find().sort({ table_number: 1 }).populate("current_session");

    // Gather active order stats for occupied tables
    const enrichedTables = await Promise.all(
        tables.map(async (table) => {
            const tableObj = table.toJSON();
            if (table.status === "occupied" && table.current_session?.bill_session_id) {
                const activeOrders = await Order.find({
                    billSessionId: table.current_session.bill_session_id
                }).select("status totalAmount isPaid paymentStatus createdAt");
                
                tableObj.orders = activeOrders;
                tableObj.totalBill = activeOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
            } else {
                tableObj.orders = [];
                tableObj.totalBill = 0;
            }
            return tableObj;
        })
    );

    return res
        .status(200)
        .json(new ApiResponce(200, enrichedTables, "Tables retrieved successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Create or Update Table (Admin / Staff)
// ─────────────────────────────────────────────────────────────────────────────
export const createOrUpdateTable = asyncHandler(async (req, res) => {
    const { table_number, capacity } = req.body;

    if (!table_number || String(table_number).trim() === "") {
        throw new ApiError(400, "Table number is required.");
    }

    const cleanTableNumber = String(table_number).trim();
    const baseUrl = getClientBaseUrl(req);
    const qrDataUrl = await generateTableQrDataUrl(cleanTableNumber, baseUrl);

    let table = await Table.findOne({ table_number: cleanTableNumber });

    if (table) {
        table.capacity = Number(capacity) || table.capacity || 4;
        table.qr_code_url = qrDataUrl;
        await table.save();
        return res
            .status(200)
            .json(new ApiResponce(200, table, `Table ${cleanTableNumber} updated with new QR code.`));
    }

    table = await Table.create({
        table_number: cleanTableNumber,
        capacity: Number(capacity) || 4,
        qr_code_url: qrDataUrl,
        status: "available"
    });

    return res
        .status(201)
        .json(new ApiResponce(201, table, `Table ${cleanTableNumber} created successfully.`));
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Customer Scan Info (Public: /api/tables/scan-info?table=5)
// ─────────────────────────────────────────────────────────────────────────────
export const getTableScanInfo = asyncHandler(async (req, res) => {
    const tableParam = req.query.table || req.params.tableNumber;
    if (!tableParam) {
        throw new ApiError(400, "Table number query parameter is required.");
    }

    const cleanTableNumber = String(tableParam).trim();
    let table = await Table.findOne({ table_number: cleanTableNumber }).populate("current_session");

    // If table doesn't exist yet, auto-provision it with dynamic QR code
    if (!table) {
        const baseUrl = getClientBaseUrl(req);
        const qrDataUrl = await generateTableQrDataUrl(cleanTableNumber, baseUrl);
        table = await Table.create({
            table_number: cleanTableNumber,
            capacity: 4,
            qr_code_url: qrDataUrl,
            status: "available"
        });
    }

    const clientToken = req.headers["x-session-token"] || req.cookies?.cafeolive_customer_token;

    // Check if client is already an active registered diner at this table
    let isCurrentDiner = false;
    let activeSession = null;

    if (table.status === "occupied" && table.current_session) {
        if (clientToken && table.current_session.session_token === clientToken) {
            isCurrentDiner = true;
            activeSession = table.current_session;
        }
    }

    return res.status(200).json(
        new ApiResponce(
            200,
            {
                table: {
                    id: table._id,
                    table_number: table.table_number,
                    status: table.status,
                    capacity: table.capacity,
                    qr_code_url: table.qr_code_url
                },
                isCurrentDiner,
                hasActiveSession: table.status === "occupied" && !!table.current_session,
                activeSession: isCurrentDiner
                    ? {
                          customer_name: activeSession.customer_name,
                          customer_phone: activeSession.customer_phone,
                          session_token: activeSession.session_token,
                          bill_session_id: activeSession.bill_session_id
                      }
                    : null
            },
            "Table scan info fetched"
        )
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Customer Registration & Session Creation (Public)
// ─────────────────────────────────────────────────────────────────────────────
export const registerCustomerSession = asyncHandler(async (req, res) => {
    const { table_number, customer_name, customer_phone } = req.body;

    if (!table_number || String(table_number).trim() === "") {
        throw new ApiError(400, "Table number is required.");
    }
    if (!customer_name || String(customer_name).trim().length < 2) {
        throw new ApiError(400, "Full name is required (minimum 2 characters).");
    }
    if (!customer_phone || String(customer_phone).trim().length < 7) {
        throw new ApiError(400, "Valid phone number is required (minimum 7 digits).");
    }

    const cleanTable = String(table_number).trim();
    const cleanName = String(customer_name).trim();
    const cleanPhone = String(customer_phone).trim();

    let table = await Table.findOne({ table_number: cleanTable });
    if (!table) {
        const baseUrl = getClientBaseUrl(req);
        const qrDataUrl = await generateTableQrDataUrl(cleanTable, baseUrl);
        table = await Table.create({
            table_number: cleanTable,
            capacity: 4,
            qr_code_url: qrDataUrl,
            status: "available"
        });
    }

    // Check if table currently has an active session
    let existingSession = null;
    if (table.current_session) {
        existingSession = await TableSession.findById(table.current_session);
    }

    // If active session belongs to the SAME guest phone, reuse and refresh
    if (existingSession && existingSession.status === "active" && existingSession.customer_phone === cleanPhone) {
        return res.status(200).json(
            new ApiResponce(
                200,
                {
                    session_token: existingSession.session_token,
                    bill_session_id: existingSession.bill_session_id,
                    table_number: cleanTable,
                    customer_name: existingSession.customer_name,
                    customer_phone: existingSession.customer_phone,
                    status: "active"
                },
                "Existing table session resumed"
            )
        );
    }

    // Close any previous hanging active session for this table
    await TableSession.updateMany(
        { table_id: table._id, status: "active" },
        { status: "completed", closed_at: new Date() }
    );

    // Create a new session token & a billSessionId (UUID v4)
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const billSessionId = crypto.randomUUID();

    const newSession = await TableSession.create({
        table_id: table._id,
        table_number: cleanTable,
        customer_name: cleanName,
        customer_phone: cleanPhone,
        session_token: sessionToken,
        bill_session_id: billSessionId,
        status: "active"
    });

    // Mark Table as occupied and link current session
    table.status = "occupied";
    table.current_session = newSession._id;
    table.current_customer_name = cleanName;
    table.current_customer_phone = cleanPhone;
    await table.save();

    // Set cookie for browser persistence (5 hours)
    res.cookie("cafeolive_customer_token", sessionToken, {
        httpOnly: false, // Accessible to frontend scripts for easy sync
        sameSite: "strict",
        maxAge: 5 * 60 * 60 * 1000
    });

    return res.status(201).json(
        new ApiResponce(
            201,
            {
                session_token: sessionToken,
                bill_session_id: billSessionId,
                table_number: cleanTable,
                customer_name: cleanName,
                customer_phone: cleanPhone,
                status: "active"
            },
            "Dine-in table session successfully registered!"
        )
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Close / Reset Table Session (Admin & All Staff)
// ─────────────────────────────────────────────────────────────────────────────
export const resetTableSession = asyncHandler(async (req, res) => {
    const { identifier } = req.params; // Can be MongoDB _id OR table_number

    let table = null;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        table = await Table.findById(identifier);
    }
    if (!table) {
        table = await Table.findOne({ table_number: identifier });
    }

    if (!table) {
        throw new ApiError(404, `Table '${identifier}' not found.`);
    }

    // Complete all active sessions for this table
    await TableSession.updateMany(
        { table_id: table._id, status: "active" },
        {
            status: "completed",
            closed_at: new Date(),
            closed_by: req.user?._id || null
        }
    );

    // Reset Table to available
    table.status = "available";
    table.current_session = null;
    table.current_customer_name = "";
    table.current_customer_phone = "";
    await table.save();

    return res.status(200).json(
        new ApiResponce(
            200,
            table,
            `Table ${table.table_number} session closed and table reset to available.`
        )
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Delete Table (Admin / Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTable = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const table = await Table.findById(id);
    if (!table) {
        throw new ApiError(404, "Table not found.");
    }

    await TableSession.deleteMany({ table_id: table._id });
    await Table.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponce(200, null, `Table ${table.table_number} removed.`));
});
