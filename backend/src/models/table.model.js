import mongoose, { Schema } from "mongoose";

const tableSchema = new Schema(
    {
        table_number: {
            type: String,
            required: [true, "Table number is required"],
            unique: true,
            trim: true,
            index: true
        },
        qr_code_url: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["available", "occupied", "inactive"],
            default: "available",
            index: true
        },
        capacity: {
            type: Number,
            default: 4,
            min: 1
        },
        current_session: {
            type: Schema.Types.ObjectId,
            ref: "TableSession",
            default: null
        },
        current_customer_name: {
            type: String,
            default: ""
        },
        current_customer_phone: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        toJSON: {
            virtuals: true,
            transform: function (_, ret) {
                ret.id = ret._id;
                return ret;
            }
        }
    }
);

// Helpful virtual aliases for flexible frontend consumption
tableSchema.virtual("tableNumber").get(function () {
    return this.table_number;
});
tableSchema.virtual("qrCodeUrl").get(function () {
    return this.qr_code_url;
});

export const Table = mongoose.model("Table", tableSchema);
