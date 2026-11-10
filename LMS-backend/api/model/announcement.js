const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: String,
  size: Number,
}, { _id: false });

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  summary: { type: String, trim: true, maxlength: 300, default: "" },
  content: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ["General", "HR", "Policy", "Payroll", "Leave", "Holiday", "Events", "IT", "Training", "Emergency"],
    default: "General",
  },
  priority: { type: String, enum: ["normal", "important", "urgent"], default: "normal" },
  audience: {
    type: { type: String, enum: ["all", "departments", "employees"], default: "all" },
    departments: [{ type: String, trim: true }],
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  status: { type: String, enum: ["draft", "scheduled", "published", "archived"], default: "draft", index: true },
  publishAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, default: null, index: true },
  isPinned: { type: Boolean, default: false },
  requiresAcknowledgement: { type: Boolean, default: false },
  attachments: [attachmentSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
}, { timestamps: true });

announcementSchema.index({
  status: 1,
  publishAt: 1,
  expiresAt: 1
});

announcementSchema.index({
  "audience.type": 1,
  "audience.departments": 1
});

announcementSchema.index({
  "audience.type": 1,
  "audience.employees": 1
});
module.exports = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
