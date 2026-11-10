const mongoose = require("mongoose");

const announcementReadSchema = new mongoose.Schema({
  announcement: { type: mongoose.Schema.Types.ObjectId, ref: "Announcement", required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  readAt: { type: Date, default: Date.now },
}, { timestamps: true });

announcementReadSchema.index({ announcement: 1, employee: 1 }, { unique: true });
module.exports = mongoose.models.AnnouncementRead || mongoose.model("AnnouncementRead", announcementReadSchema);
