const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    emp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    documentname: {
      type: String,
      trim: true,
      required: true,
      maxlength: 150,
    },

    documenttype: {
      type: String,
      required: true,
      enum: [
        "Identity",
        "Address",
        "Education",
        "Experience",
        "Certificate",
        "Offer Letter",
        "Employment Agreement",
        "Bank Details",
        "Tax",
        "Other",
        "Picture",
      ],
    },

    image: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ emp_id: 1, createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);