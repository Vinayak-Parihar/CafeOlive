import mongoose, { Schema } from "mongoose";

const restaurantSchema = new Schema(
    {
        name: {
            type: String,
            default: "Cafe Olive"
        },
        menuItemsPerRow: {
            type: Number,
            default: 4,
            min: 2,
            max: 10
        },
        homeMedia: [{
            section: {
                type: String,
                required: true,
                trim: true
            },
            imageKey: {
                type: String,
                required: true,
                trim: true
            },
            label: {
                type: String,
                default: "Gallery image",
                trim: true
            },
            capacity: {
                type: String,
                default: "",
                trim: true
            },
            description: {
                type: String,
                default: "",
                trim: true
            },
            imageUrl: {
                type: String,
                default: ""
            },
            cloudinaryPublicId: {
                type: String,
                default: ""
            },
            order: {
                type: Number,
                default: 0
            },
            isEnabled: {
                type: Boolean,
                default: true
            },
            isDeleted: {
                type: Boolean,
                default: false
            }
        }]
    },
    {
        timestamps: true
    }
);

restaurantSchema.index({ "homeMedia.imageKey": 1 });

export const Restaurant = mongoose.model("Restaurant", restaurantSchema);
