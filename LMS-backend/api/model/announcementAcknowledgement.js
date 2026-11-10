const mongoose = require("mongoose");

const acknowledgementSchema = new mongoose.Schema({
  announcement: { type: mongoose.Schema.Types.ObjectId, ref: "Announcement", required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  acknowledgedAt: { type: Date, default: Date.now },
  note: { type: String, trim: true, maxlength: 500, default: "" },
}, { timestamps: true });

acknowledgementSchema.index({ announcement: 1, employee: 1 }, { unique: true });
module.exports = mongoose.models.AnnouncementAcknowledgement || mongoose.model("AnnouncementAcknowledgement", acknowledgementSchema);
