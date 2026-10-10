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


    return res.status(200).json(
        new ApiResponce(200, {
            totalOrders,
            todayOrders,
            todayOnlinePayments,
            todayRevenue,
            statusBreakdown: formattedBreakdown
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
    storedMedia
        .filter((media) => media.section === "gallery" && !definitions.some((definition) => definition.imageKey === media.imageKey))
        .forEach((media) => definitions.push({
            section: media.section,
            imageKey: media.imageKey,
            label: media.label || "Gallery image",
            category: media.category || "Gallery",
            defaultUrl: "",
            order: media.order || 0,
            isGallery: true
        }));

    return definitions.sort((first, second) => {
        if (first.section === second.section) return first.order - second.order;
        return first.section.localeCompare(second.section);
    }).map((definition) => {
        const stored = storedMedia.find((media) => media.imageKey === definition.imageKey);

        return {
        section: definition.section,
        imageKey: definition.imageKey,
        label: definition.label,
        category: definition.category || "Gallery",
        imageUrl: stored?.isEnabled === false ? "" : (stored?.imageUrl || definition.defaultUrl),
        cloudinaryPublicId: stored?.cloudinaryPublicId || "",
        order: stored?.order ?? definition.order,
        isEnabled: stored?.isEnabled !== false,
        isDefault: !stored,
        isGallery: Boolean(definition.isGallery)
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
    const definition = getHomeMediaDefinition(imageKey) || (storedMedia?.section === "gallery" ? {
        section: "gallery",
        imageKey,
        label: storedMedia.label || "Gallery image",
        defaultUrl: "",
        order: storedMedia.order || 0,
        isGallery: true
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
        isEnabled: true
    };

    if (current) {
        Object.assign(current, nextMedia);
    } else {
        restaurant.homeMedia.push(nextMedia);
    }

    await restaurant.save();
    if (previousPublicId && previousPublicId !== uploadResult.public_id) {
        await deleteFileFromCloudinary(previousPublicId);
    }

    return res.status(200).json(
        new ApiResponce(200, { media: toHomeMediaResponse(restaurant) }, "Home image updated successfully")
    );
});

const addGalleryMedia = asyncHandler(async (req, res) => {
    const label = String(req.body.label || "Gallery image").trim().slice(0, 80);
    if (!req.file) throw new ApiError(400, "An image file is required.");

    const uploadResult = await uploadFilesOnCloudinary(req.file.path);
    if (!uploadResult) throw new ApiError(500, "Failed to upload image to Cloudinary.");

    let restaurant = await Restaurant.findOne();
    if (!restaurant) restaurant = new Restaurant();
    const galleryItems = restaurant.homeMedia.filter((media) => media.section === "gallery");
    const imageKey = `gallery-image-${Date.now()}`;
    restaurant.homeMedia.push({
        section: "gallery",
        imageKey,
        imageUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        order: galleryItems.length,
        isEnabled: true,
        label
    });
    await restaurant.save();

    return res.status(201).json(
        new ApiResponce(201, { media: toHomeMediaResponse(restaurant) }, "Gallery image added successfully")
    );
});

const removeHomeMedia = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findOne();
    const storedMedia = restaurant?.homeMedia?.find((media) => media.imageKey === req.params.imageKey);
    const definition = getHomeMediaDefinition(req.params.imageKey) || (storedMedia?.section === "gallery" ? storedMedia : null);
    if (!definition) {
        throw new ApiError(400, "Invalid home media image key.");
    }

    if (!restaurant) {
        return res.status(200).json(
            new ApiResponce(200, { media: toHomeMediaResponse(null) }, "Home image removed successfully")
        );
    }

    const current = restaurant.homeMedia.find((media) => media.imageKey === definition.imageKey);
    if (current) {
        const previousPublicId = current.cloudinaryPublicId;
        current.imageUrl = "";
        current.cloudinaryPublicId = "";
        current.isEnabled = false;
        await restaurant.save();
        if (previousPublicId) await deleteFileFromCloudinary(previousPublicId);
    } else {
        restaurant.homeMedia.push({
            section: definition.section,
            imageKey: definition.imageKey,
            label: definition.label,
            imageUrl: "",
            cloudinaryPublicId: "",
            order: definition.order,
            isEnabled: false
        });
        await restaurant.save();
    }

    return res.status(200).json(
        new ApiResponce(200, { media: toHomeMediaResponse(restaurant) }, "Home image removed successfully")
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
    updateSiteSettings
};
