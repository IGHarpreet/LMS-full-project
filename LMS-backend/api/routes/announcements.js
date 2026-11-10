const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const Announcement = require("../model/announcement");
const AnnouncementRead = require("../model/announcementRead");
const AnnouncementAcknowledgement = require("../model/announcementAcknowledgement");
const User = require("../model/user");

const JWT_SECRET = "9263d55f3cf9fff7fe039ce6f40c8dbf0a0f6d7f4e10a734f779dd4c768ea3f5c7dd143442ef2ae45592a4a374b8bdf4b52313d16e6a0c8a121fe351f915e8c0"; // Must match the signing key currently used by /user/login.
const uploadDir = path.join(
  __dirname,
  "..",
  "private_uploads",
  "announcements"
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}`);
  },
});
const allowedMime = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg", "image/png", "image/webp",
]);
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => cb(null, allowedMime.has(file.mimetype)),
});

function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Authentication required." });
    req.user = jwt.verify(token, JWT_SECRET);
    if (!req.user?._id || !["admin", "hr", "employee"].includes(String(req.user.role).toLowerCase())) {
      return res.status(401).json({ message: "Invalid user session." });
    }
    next();
  } catch (_error) {
    return res.status(401).json({ message: "Your session is invalid or expired. Please sign in again." });
  }
}
function managerOnly(req, res, next) {
  if (["admin", "hr"].includes(String(req.user.role).toLowerCase())) return next();
  return res.status(403).json({ message: "Only Admin or HR can perform this action." });
}
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const cleanAudience = (value = {}) => ({
  type: ["all", "departments", "employees"].includes(value.type) ? value.type : "all",
  departments: Array.isArray(value.departments) ? value.departments.map(String).filter(Boolean) : [],
  employees: Array.isArray(value.employees) ? value.employees.filter(isValidId) : [],
});
function audienceQuery(userId, department) {
  const conditions = [
    { "audience.type": "all" },
    {
      "audience.type": "employees",
      "audience.employees": userId,
    },
  ];

  if (department) {
    conditions.push({
      "audience.type": "departments",
      "audience.departments": department,
    });
  }

  return { $or: conditions };
}
function visibleToEmployee(doc, userId, department) {
  const a = doc.audience || {};
  if (a.type === "all") return true;
  if (a.type === "employees") return (a.employees || []).some((id) => String(id) === String(userId));
  if (a.type === "departments") return !!department && (a.departments || []).includes(department);
  return false;
}
function serializeAttachment(file) {
  return {
    originalName: file.originalname,
    fileName: file.filename,
    url: `/announcements/files/${encodeURIComponent(file.filename)}`,
    mimeType: file.mimetype,
    size: file.size,
  };
}

router.use(authenticate);

// Audience choices for the admin composer. Department is optional on legacy user records.
router.get("/meta/audience", managerOnly, async (_req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("name email department").sort({ name: 1 }).lean();
    const departments = [...new Set(employees.map((u) => u.department).filter(Boolean))].sort();
    res.json({ employees, departments });
    console.log("Deparmnts", departments)
  } catch (error) {
    res.status(500).json({ message: "Unable to load audience options.", error: error.message });
  }
});

// Admin/HR see all records; employees only see currently published items targeted to them.
router.get("/", async (req, res) => {
  try {
    const role = String(req.user.role).toLowerCase();
    const now = new Date();
    await Announcement.updateMany({ status: "scheduled", publishAt: { $lte: now } }, { $set: { status: "published" } });
    let query = {};
    if (role === "employee") {
      const user = await User.findById(req.user._id).select("department").lean();
      query = {
        status: { $in: ["published", "scheduled"] },
        publishAt: { $lte: now },
        $and: [
          { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
          audienceQuery(req.user._id, user?.department),
        ],
      };
    } else {
      if (req.query.status && ["draft", "scheduled", "published", "archived"].includes(req.query.status)) {
        query.status = req.query.status;
      }
    }
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) {
      const term = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [...(query.$or || []), { title: { $regex: term, $options: "i" } }, { summary: { $regex: term, $options: "i" } }, { content: { $regex: term, $options: "i" } }];
    }

    const items = await Announcement.find(query)
      .sort({ isPinned: -1, publishAt: -1, createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 100, 200))
      .lean();

    const ids = items.map((item) => item._id);
    const [reads, acknowledgements] = await Promise.all([
      AnnouncementRead.find({ announcement: { $in: ids }, employee: req.user._id }).select("announcement readAt").lean(),
      AnnouncementAcknowledgement.find({ announcement: { $in: ids }, employee: req.user._id }).select("announcement acknowledgedAt").lean(),
    ]);
    const readSet = new Map(reads.map((r) => [String(r.announcement), r]));
    const ackSet = new Map(acknowledgements.map((a) => [String(a.announcement), a]));
    res.json({ announcements: items.map((item) => ({
      ...item,
      isRead: readSet.has(String(item._id)),
      readAt: readSet.get(String(item._id))?.readAt || null,
      isAcknowledged: ackSet.has(String(item._id)),
      acknowledgedAt: ackSet.get(String(item._id))?.acknowledgedAt || null,
    })) });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch announcements.", error: error.message });
  }
});

router.get("/files/:fileName", async (req, res) => {
  try {
    const fileName = path.basename(decodeURIComponent(req.params.fileName));
    const announcement = await Announcement.findOne({ "attachments.fileName": fileName }).lean();
    if (!announcement) return res.status(404).json({ message: "Attachment not found." });
    if (req.user.role === "employee") {
      const user = await User.findById(req.user._id).select("department").lean();
      const now = new Date();
      if (!["published", "scheduled"].includes(announcement.status) || announcement.publishAt > now || (announcement.expiresAt && announcement.expiresAt <= now) || !visibleToEmployee(announcement, req.user._id, user?.department)) {
        return res.status(404).json({ message: "Attachment not found." });
      }
    }
    const fullPath = path.join(uploadDir, fileName);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "Attachment not found." });
    return res.sendFile(fullPath);
  } catch (error) {
    return res.status(400).json({ message: "Unable to download attachment.", error: error.message });
  }
});

router.post("/", managerOnly, upload.array("attachments", 5), async (req, res) => {
  try {
    const body = req.body;
    if (!String(body.title || "").trim() || !String(body.content || "").trim()) {
      return res.status(400).json({ message: "Title and announcement content are required." });
    }
    let audience;
    try { audience = cleanAudience(body.audience ? JSON.parse(body.audience) : {}); }
    catch (_e) { return res.status(400).json({ message: "Invalid audience selection." }); }
    if (audience.type === "departments" && !audience.departments.length) return res.status(400).json({ message: "Select at least one department." });
    if (audience.type === "employees" && !audience.employees.length) return res.status(400).json({ message: "Select at least one employee." });

    const publishAt = body.publishAt ? new Date(body.publishAt) : new Date();
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (Number.isNaN(publishAt.getTime()) || (expiresAt && Number.isNaN(expiresAt.getTime()))) return res.status(400).json({ message: "Enter valid publish and expiry dates." });
    if (expiresAt && expiresAt <= publishAt) return res.status(400).json({ message: "Expiry must be later than the publish date." });
    const status = body.status === "draft" ? "draft" : publishAt > new Date() ? "scheduled" : "published";
    const doc = await Announcement.create({
      title: String(body.title).trim(), summary: String(body.summary || "").trim(), content: String(body.content).trim(),
      category: body.category || "General", priority: body.priority || "normal", audience, status,
      publishAt, expiresAt, isPinned: body.isPinned === "true", requiresAcknowledgement: body.requiresAcknowledgement === "true",
      attachments: (req.files || []).map(serializeAttachment), createdBy: req.user._id, updatedBy: req.user._id,
    });
    res.status(201).json({ message: "Announcement created successfully.", announcement: doc });
  } catch (error) {
    (req.files || []).forEach((f) => fs.unlink(f.path, () => {}));
    res.status(500).json({ message: "Unable to create announcement.", error: error.message });
  }
});

router.get("/:id/analytics", managerOnly, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid announcement ID." });
    const announcement = await Announcement.findById(req.params.id).lean();
    if (!announcement) return res.status(404).json({ message: "Announcement not found." });
    const users = await User.find({ role: "employee" }).select("_id name email department").lean();
    const eligible = users.filter((u) => visibleToEmployee(announcement, u._id, u.department));
    const [reads, acknowledgements] = await Promise.all([
      AnnouncementRead.find({ announcement: announcement._id }).populate("employee", "name email department").lean(),
      AnnouncementAcknowledgement.find({ announcement: announcement._id }).populate("employee", "name email department").lean(),
    ]);
    res.json({ totalAudience: eligible.length, readCount: reads.length, unreadCount: Math.max(eligible.length - reads.length, 0), acknowledgementCount: acknowledgements.length, pendingAcknowledgementCount: announcement.requiresAcknowledgement ? Math.max(eligible.length - acknowledgements.length, 0) : 0, reads, acknowledgements, employees: eligible });
  } catch (error) { res.status(500).json({ message: "Unable to load announcement analytics.", error: error.message }); }
});
// Department list for any logged-in user (used by the leave form)
router.get("/meta/departments", async (req, res) => {
  try {
    const [userDepts, audienceDepts, me] = await Promise.all([
      User.distinct("department", { department: { $nin: [null, ""] } }),
      Announcement.distinct("audience.departments"),
      User.findById(req.user._id).select("department").lean(),
    ]);

    const myDepartment = me?.department || "";
    const list = [
      ...new Set(
        [...userDepts, ...audienceDepts, myDepartment]
          .map((d) => String(d || "").trim())
          .filter(Boolean)
      ),
    ].sort();

    res.json({ departments: list, myDepartment });
  } catch (error) {
    res.status(500).json({ message: "Unable to load departments.", error: error.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid announcement ID." });
    const item = await Announcement.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Announcement not found." });
    if (req.user.role === "employee") {
      const user = await User.findById(req.user._id).select("department").lean();
      const now = new Date();
      if (!["published", "scheduled"].includes(item.status) || item.publishAt > now || (item.expiresAt && item.expiresAt <= now) || !visibleToEmployee(item, req.user._id, user?.department)) return res.status(404).json({ message: "Announcement not found." });
    }
    res.json({ announcement: item });
  } catch (error) { res.status(500).json({ message: "Unable to load announcement.", error: error.message }); }
});

router.put("/:id", managerOnly, upload.array("attachments", 5), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid announcement ID." });
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found." });
    const body = req.body;
    if (body.title !== undefined) item.title = String(body.title).trim();
    if (body.summary !== undefined) item.summary = String(body.summary).trim();
    if (body.content !== undefined) item.content = String(body.content).trim();
    if (body.category) item.category = body.category;
    if (body.priority) item.priority = body.priority;
    if (body.audience) {
  try {
    const audience = cleanAudience(JSON.parse(body.audience));

    if (
      audience.type === "departments" &&
      !audience.departments.length
    ) {
      return res.status(400).json({
        message: "Select at least one department.",
      });
    }

    if (
      audience.type === "employees" &&
      !audience.employees.length
    ) {
      return res.status(400).json({
        message: "Select at least one employee.",
      });
    }

    item.audience = audience;
  } catch (error) {
    return res.status(400).json({
      message: "Invalid audience selection.",
    });
  }
}
    if (body.publishAt) item.publishAt = new Date(body.publishAt);
    if (body.expiresAt !== undefined) item.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (body.isPinned !== undefined) item.isPinned = body.isPinned === "true";
    if (body.requiresAcknowledgement !== undefined) item.requiresAcknowledgement = body.requiresAcknowledgement === "true";
    if (body.status === "draft") item.status = "draft";
    else if (body.status === "archived") item.status = "archived";
    else item.status = item.publishAt > new Date() ? "scheduled" : "published";
    if (req.files?.length) item.attachments.push(...req.files.map(serializeAttachment));
    item.updatedBy = req.user._id;
    await item.save();
    res.json({ message: "Announcement updated successfully.", announcement: item });
  } catch (error) { (req.files || []).forEach((f) => fs.unlink(f.path, () => {})); res.status(500).json({ message: "Unable to update announcement.", error: error.message }); }
});

router.delete("/:id", managerOnly, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid announcement ID." });
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found." });
    await Promise.all([AnnouncementRead.deleteMany({ announcement: item._id }), AnnouncementAcknowledgement.deleteMany({ announcement: item._id })]);
    res.json({ message: "Announcement deleted successfully." });
  } catch (error) { res.status(500).json({ message: "Unable to delete announcement.", error: error.message }); }
});

router.patch("/:id/publish", managerOnly, async (req, res) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found." });
    item.status = item.publishAt > new Date() ? "scheduled" : "published";
    item.updatedBy = req.user._id;
    await item.save();
    res.json({ message: item.status === "scheduled" ? "Announcement scheduled." : "Announcement published.", announcement: item });
  } catch (error) { res.status(500).json({ message: "Unable to publish announcement.", error: error.message }); }
});

router.patch("/:id/archive", managerOnly, async (req, res) => {
  try {
    const item = await Announcement.findByIdAndUpdate(req.params.id, { status: "archived", updatedBy: req.user._id }, { new: true });
    if (!item) return res.status(404).json({ message: "Announcement not found." });
    res.json({ message: "Announcement archived.", announcement: item });
  } catch (error) { res.status(500).json({ message: "Unable to archive announcement.", error: error.message }); }
});
router.patch("/:id/unarchive", managerOnly, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid announcement ID." });
    }

    const item = await Announcement.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    if (item.status !== "archived") {
      return res.status(400).json({
        message: "This announcement is not archived."
      });
    }

    // Restore the appropriate status using its publish date.
    item.status =
      item.publishAt && item.publishAt > new Date()
        ? "scheduled"
        : "published";

    item.updatedBy = req.user._id;

    await item.save();

    return res.json({
      message: "Announcement unarchived successfully.",
      announcement: item
    });

  } catch (error) {
    return res.status(500).json({
      message: "Unable to unarchive announcement.",
      error: error.message
    });
  }
});
router.patch("/:id/pin", managerOnly, async (req, res) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found." });
    item.isPinned = typeof req.body.isPinned === "boolean" ? req.body.isPinned : !item.isPinned;
    item.updatedBy = req.user._id;
    await item.save();
    res.json({ message: item.isPinned ? "Announcement pinned." : "Announcement unpinned.", announcement: item });
  } catch (error) { res.status(500).json({ message: "Unable to update pin status.", error: error.message }); }
});

router.post("/:id/read", async (req, res) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found." });
    if (req.user.role === "employee") {
      const user = await User.findById(req.user._id).select("department").lean();
      if (!["published", "scheduled"].includes(item.status) || item.publishAt > new Date() || (item.expiresAt && item.expiresAt <= new Date()) || !visibleToEmployee(item, req.user._id, user?.department)) return res.status(404).json({ message: "Announcement not found." });
    }
    const read = await AnnouncementRead.findOneAndUpdate({ announcement: item._id, employee: req.user._id }, { $setOnInsert: { readAt: new Date() } }, { upsert: true, new: true });
    res.json({ message: "Marked as read.", readAt: read.readAt });
  } catch (error) { res.status(500).json({ message: "Unable to mark as read.", error: error.message }); }
});

router.post("/:id/acknowledge", async (req, res) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item || !["published", "scheduled"].includes(item.status) || item.publishAt > new Date() || (item.expiresAt && item.expiresAt <= new Date()) || !item.requiresAcknowledgement) return res.status(404).json({ message: "Acknowledgement is not available." });
    const user = await User.findById(req.user._id).select("department").lean();
    if (req.user.role === "employee" && !visibleToEmployee(item, req.user._id, user?.department)) return res.status(404).json({ message: "Announcement not found." });
    const ack = await AnnouncementAcknowledgement.findOneAndUpdate({ announcement: item._id, employee: req.user._id }, { $setOnInsert: { acknowledgedAt: new Date(), note: String(req.body.note || "").slice(0, 500) } }, { upsert: true, new: true });
    res.json({ message: "Acknowledgement recorded.", acknowledgedAt: ack.acknowledgedAt });
  } catch (error) { res.status(500).json({ message: "Unable to record acknowledgement.", error: error.message }); }
});

router.get("/unread/count", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("department").lean();
    const now = new Date();
    const query = { status: { $in: ["published", "scheduled"] }, publishAt: { $lte: now }, $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }, audienceQuery(req.user._id, user?.department)] };
    const items = await Announcement.find(query).select("_id requiresAcknowledgement").lean();
    const ids = items.map((x) => x._id);
    const [reads, acks] = await Promise.all([
      AnnouncementRead.find({ employee: req.user._id, announcement: { $in: ids } }).distinct("announcement"),
      AnnouncementAcknowledgement.find({ employee: req.user._id, announcement: { $in: ids } }).distinct("announcement"),
    ]);
    res.json({ unread: Math.max(items.length - reads.length, 0), pendingAcknowledgements: items.filter((x) => x.requiresAcknowledgement && !acks.some((id) => String(id) === String(x._id))).length, total: items.length });
  } catch (error) { res.status(500).json({ message: "Unable to load announcement counts.", error: error.message }); }
});

module.exports = router;
