import mongoose, { Schema } from "mongoose";

const tableSessionSchema = new Schema(
    {
        table_id: {
            type: Schema.Types.ObjectId,
            ref: "Table",
            required: [true, "table_id is required"],
            index: true
        },
        table_number: {
            type: String,
            required: true,
            trim: true
        },
        customer_name: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true,
            maxlength: 80
        },
        customer_phone: {
            type: String,
            required: [true, "Customer phone number is required"],
            trim: true,
            maxlength: 20
        },
        session_token: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        bill_session_id: {
            type: String,
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ["active", "completed"],
            default: "active",
            index: true
        },
        closed_at: {
            type: Date,
            default: null
        },
        closed_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
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

// Virtual aliases
tableSessionSchema.virtual("customerName").get(function () {
    return this.customer_name;
});
tableSessionSchema.virtual("customerPhone").get(function () {
    return this.customer_phone;
});
tableSessionSchema.virtual("sessionToken").get(function () {
    return this.session_token;
});

export const TableSession = mongoose.model("TableSession", tableSessionSchema);
