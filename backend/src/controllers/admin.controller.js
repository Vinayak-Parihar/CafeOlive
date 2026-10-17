import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js"; // Corrected typo from existing codebase if needed, but keeping consistency
import { Order } from "../models/order.model.js";

const getDashboardStats = asyncHandler(async (req, res) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Total Orders
    const totalOrders = await Order.countDocuments();

    // 2. Today's Orders
    const todayOrders = await Order.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    // 3. Today's Online Payments (Assuming isPaid=true means online/successful payment for now, or check detailed status if available)
    // Adjust logic if "online payment" implies specific payment method validation. 
    // For now, based on request "Total number of online payments made today", I'll assume 'isPaid: true' counts.
    const todayOnlinePayments = await Order.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
        isPaid: true
    });

    // 4. Today's Revenue
    const todayRevenueAgg = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: todayStart, $lte: todayEnd },
                status: { $ne: 'cancelled' } // Exclude cancelled orders
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" }
            }
        }
    ]);
    const todayRevenue = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].totalRevenue : 0;

    // 5. Order Status Breakdown
    const statusBreakdown = await Order.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    // Format breakdown slightly better
    const formattedBreakdown = statusBreakdown.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    // 6. Recent Sales & Orders Timeline for Graphs
    const timelineAgg = await Order.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                orders: { $sum: 1 },
                revenue: {
                    $sum: {
                        $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0]
                    }
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const salesTimeline = timelineAgg.slice(-7).map(item => {
        const d = new Date(item._id);
        const dayLabel = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : item._id;
        return {
            date: item._id,
            label: dayLabel,
            orders: item.orders,
            revenue: item.revenue
        };
    });

    return res.status(200).json(
        new ApiResponce(200, {
            totalOrders,
            todayOrders,
            todayOnlinePayments,
            todayRevenue,
            statusBreakdown: formattedBreakdown,
            salesTimeline
        }, "Dashboard stats fetched successfully")
    );
});

const getPendingOrders = asyncHandler(async (req, res) => {
    // Pending orders: Not completed, Not cancelled
    const pendingOrders = await Order.find({
        status: { $in: ['placed', 'preparing', 'ready', 'served'] } // Adjust based on what "pending" strictly means. Usually "placed" or "preparing".
        // Request says "dropdown list of pending orders". I'll include active orders.
    }).sort({ createdAt: -1 }); // Newest first

    return res.status(200).json(
        new ApiResponce(200, pendingOrders, "Pending orders fetched successfully")
    );
});

import { Restaurant } from "../models/restaurant.model.js";
import { deleteFileFromCloudinary, uploadFilesOnCloudinary } from "../utils/cloudnarry.js";
import { getHomeMediaDefinition, HOME_MEDIA } from "../constants/homeMedia.js";
// fs/path removed as not needed for local storage logic anymore

// ... (existing imports)

const toHomeMediaResponse = (restaurant) => {
    const storedMedia = restaurant?.homeMedia || [];
    const definitions = [...HOME_MEDIA];

    // Include custom dynamic items (gallery images or reservation halls)
    storedMedia
        .filter((media) => (media.section === "gallery" || media.section === "reservations") && !definitions.some((definition) => definition.imageKey === media.imageKey))
        .forEach((media) => definitions.push({
            section: media.section,
            imageKey: media.imageKey,
            label: media.label || (media.section === "reservations" ? "Reservation: Party Hall" : "Gallery image"),
            capacity: media.capacity || "",
            description: media.description || "",
            category: media.category || (media.section === "reservations" ? "Party Halls" : "Gallery"),
            defaultUrl: "",
            order: media.order || 0,
            isGallery: media.section === "gallery",
            isCustom: true
        }));

    return definitions
        .filter((definition) => {
            const stored = storedMedia.find((media) => media.imageKey === definition.imageKey);
            // Hide items that have been explicitly deleted
            if (stored?.isDeleted) return false;
            return true;
        })
        .sort((first, second) => {
            if (first.section === second.section) return first.order - second.order;
            return first.section.localeCompare(second.section);
        })
        .map((definition) => {
            const stored = storedMedia.find((media) => media.imageKey === definition.imageKey);

            return {
                section: definition.section,
                imageKey: definition.imageKey,
                label: stored?.label || definition.label,
                capacity: stored?.capacity || definition.capacity || "",
                description: stored?.description || definition.description || "",
                category: definition.category || (definition.section === "reservations" ? "Party Halls" : "Gallery"),
                imageUrl: stored?.isEnabled === false ? "" : (stored?.imageUrl || definition.defaultUrl),
                cloudinaryPublicId: stored?.cloudinaryPublicId || "",
                order: stored?.order ?? definition.order,
                isEnabled: stored?.isEnabled !== false,
                isDefault: !stored,
                isGallery: Boolean(definition.isGallery),
                isCustom: Boolean(definition.isCustom)
            };
        });
};

const getHomeMedia = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findOne().lean();

    return res.status(200).json(
        new ApiResponce(200, { media: toHomeMediaResponse(restaurant) }, "Home media fetched successfully")
    );
});

const uploadHomeMedia = asyncHandler(async (req, res) => {
    const imageKey = req.params.imageKey;
    let restaurant = await Restaurant.findOne();
    const storedMedia = restaurant?.homeMedia?.find((media) => media.imageKey === imageKey);
    const definition = getHomeMediaDefinition(imageKey) || (storedMedia ? {
        section: storedMedia.section,
        imageKey,
        label: storedMedia.label || (storedMedia.section === "reservations" ? "Reservation: Party Hall" : "Media image"),
        defaultUrl: "",
        order: storedMedia.order || 0,
        isGallery: storedMedia.section === "gallery",
        isCustom: true
    } : null);

    if (!definition) {
        throw new ApiError(400, "Invalid home media image key.");
    }

    if (!req.file) {
        throw new ApiError(400, "An image file is required.");
    }

    const uploadResult = await uploadFilesOnCloudinary(req.file.path);
    if (!uploadResult) {
        throw new ApiError(500, "Failed to upload image to Cloudinary.");
    }

    if (!restaurant) restaurant = new Restaurant();

    const current = restaurant.homeMedia.find((media) => media.imageKey === imageKey);
    const previousPublicId = current?.cloudinaryPublicId;
    const nextMedia = {
        section: definition.section,
        imageKey: definition.imageKey,
        imageUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        order: current?.order ?? definition.order,
        isEnabled: true,
        isDeleted: false,
        label: current?.label || definition.label
    };

    if (current) {
        Object.assign(current, nextMedia);
    } else {
        restaurant.homeMedia.push(nextMedia);
    }

    await restaurant.save();
    if (previousPublicId && previousPublicId !== uploadResult.public_id) {
        await deleteFileFromCloudinary(previousPublicId).catch(() => {});
    }

    return res.status(200).json(
        new ApiResponce(200, { media: toHomeMediaResponse(restaurant) }, "Image updated successfully")
    );
});

const addGalleryMedia = asyncHandler(async (req, res) => {
    const section = req.body.section || "gallery";
    const defaultLabel = section === "reservations" ? "Reservation: Party Hall" : "Gallery image";
    const label = String(req.body.label || defaultLabel).trim().slice(0, 100);

    let imageUrl = "";
    let cloudinaryPublicId = "";

    if (req.file) {
        const uploadResult = await uploadFilesOnCloudinary(req.file.path);
        if (!uploadResult) throw new ApiError(500, "Failed to upload image to Cloudinary.");
        imageUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id;
    } else if (section === "gallery") {
        throw new ApiError(400, "An image file is required.");
    }

    let restaurant = await Restaurant.findOne();
    if (!restaurant) restaurant = new Restaurant();
    const sectionItems = restaurant.homeMedia.filter((media) => media.section === section);
    const prefix = section === "reservations" ? "reservation-hall" : "gallery-image";
    const imageKey = `${prefix}-${Date.now()}`;

    const capacity = String(req.body.capacity || "").trim().slice(0, 100);
    const description = String(req.body.description || "").trim().slice(0, 1000);

    restaurant.homeMedia.push({
        section,
        imageKey,
        imageUrl,
        cloudinaryPublicId,
        order: sectionItems.length + 10,
        isEnabled: true,
        isDeleted: false,
        label,
        capacity,
        description
    });
    await restaurant.save();

    return res.status(201).json(
        new ApiResponce(201, { media: toHomeMediaResponse(restaurant) }, section === "reservations" ? "Hall added successfully" : "Gallery image added successfully")
    );
});

const removeHomeMedia = asyncHandler(async (req, res) => {
    const imageKey = req.params.imageKey;
    let restaurant = await Restaurant.findOne();
    if (!restaurant) restaurant = new Restaurant();

    const storedIndex = restaurant.homeMedia.findIndex((media) => media.imageKey === imageKey);
    const storedMedia = storedIndex !== -1 ? restaurant.homeMedia[storedIndex] : null;
    const builtInDef = getHomeMediaDefinition(imageKey);

    if (!storedMedia && !builtInDef) {
        throw new ApiError(404, "Invalid home media image key.");
    }

    // Delete image from Cloudinary if stored
    const previousPublicId = storedMedia?.cloudinaryPublicId;
    if (previousPublicId) {
        await deleteFileFromCloudinary(previousPublicId).catch(() => {});
    }

    if (!builtInDef) {
        // Custom dynamic item (custom hall or custom gallery image): completely remove from database
        if (storedIndex !== -1) {
            restaurant.homeMedia.splice(storedIndex, 1);
            await restaurant.save();
        }
    } else {
        // Built-in item: mark deleted and disable
        if (storedMedia) {
            storedMedia.imageUrl = "";
            storedMedia.cloudinaryPublicId = "";
            storedMedia.isEnabled = false;
            storedMedia.isDeleted = true;
        } else {
            restaurant.homeMedia.push({
                section: builtInDef.section,
                imageKey: builtInDef.imageKey,
                label: builtInDef.label,
                imageUrl: "",
                cloudinaryPublicId: "",
                order: builtInDef.order,
                isEnabled: false,
                isDeleted: true
            });
        }
        await restaurant.save();
    }

    return res.status(200).json(
        new ApiResponce(200, { media: toHomeMediaResponse(restaurant) }, "Item removed successfully")
    );
});

const restoreDefaultMedia = asyncHandler(async (req, res) => {
    const section = req.body.section || "reservations";
    let restaurant = await Restaurant.findOne();
    if (!restaurant) restaurant = new Restaurant();

    if (section) {
        restaurant.homeMedia = restaurant.homeMedia.filter((m) => {
            const def = getHomeMediaDefinition(m.imageKey);
            if (def && def.section === section) return false;
            return true;
        });
    } else {
        restaurant.homeMedia = [];
    }
    await restaurant.save();

    return res.status(200).json(
        new ApiResponce(200, { media: toHomeMediaResponse(restaurant) }, `${section} defaults restored successfully`)
    );
});

const getSiteSettings = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findOne().lean();

    return res.status(200).json(
        new ApiResponce(200, { menuItemsPerRow: restaurant?.menuItemsPerRow ?? 4 }, "Site settings fetched successfully")
    );
});

const updateSiteSettings = asyncHandler(async (req, res) => {
    const parsed = Number(req.body.menuItemsPerRow);
    if (!Number.isInteger(parsed) || parsed < 2 || parsed > 10) {
        throw new ApiError(400, "Menu items per row must be a whole number between 2 and 10.");
    }

    let restaurant = await Restaurant.findOne();
    if (!restaurant) restaurant = new Restaurant();
    restaurant.menuItemsPerRow = parsed;
    await restaurant.save();

    return res.status(200).json(
        new ApiResponce(200, { menuItemsPerRow: restaurant.menuItemsPerRow }, "Settings updated successfully")
    );
});

export {
    getDashboardStats,
    getPendingOrders,
    getHomeMedia,
    uploadHomeMedia,
    addGalleryMedia,
    removeHomeMedia,
    getSiteSettings,
    updateSiteSettings,
    restoreDefaultMedia
};
