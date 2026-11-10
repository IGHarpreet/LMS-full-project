const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Document = require("../model/document");

// --------------------------------------------------
// UPLOAD DIRECTORY
// --------------------------------------------------

const uploadDirectory = path.resolve(
  process.cwd(),
  "api",
  "public",
  "images"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// --------------------------------------------------
// FILE UPLOAD CONFIGURATION
// --------------------------------------------------

const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const allowedExtensions = [
  ".png",
  ".jpg",
  ".jpeg",
  ".pdf",
  ".doc",
  ".docx",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extension;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const validMime = allowedMimeTypes.includes(file.mimetype);
    const validExtension = allowedExtensions.includes(extension);

    if (validMime && validExtension) {
      return cb(null, true);
    }

    cb(
      new Error(
        "Only JPG, JPEG, PNG, PDF, DOC and DOCX files are allowed."
      )
    );
  },
});

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const removeUploadedFile = (filename) => {
  if (!filename) return;

  const safeName = path.basename(filename);
  const filePath = path.join(uploadDirectory, safeName);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error("Unable to remove document file:", error);
      }
    });
  }
};

const validateDocumentFields = (body) => {
  const {
    documentname,
    documenttype,
    verificationStatus,
  } = body;

  if (
    !documentname ||
    !documentname.trim() ||
    !documenttype
  ) {
    return "Document name and document type are required.";
  }

  const allowedTypes = [
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
  ];

  if (!allowedTypes.includes(documenttype)) {
    return "Invalid document category.";
  }

  if (
    verificationStatus &&
    !["Pending", "Verified", "Rejected"].includes(
      verificationStatus
    )
  ) {
    return "Invalid verification status.";
  }

  return null;
};

// --------------------------------------------------
// ADD DOCUMENT
// POST /document/add/:emp_id
// --------------------------------------------------

router.post(
  "/add/:emp_id",
  upload.single("image"),
  async (req, res) => {
    try {
      const { emp_id } = req.params;

      if (!isValidId(emp_id)) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(400).json({
          message: "Invalid employee ID.",
        });
      }

      const validationError = validateDocumentFields(req.body);

      if (validationError) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(400).json({
          message: validationError,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please select a document file.",
        });
      }

      const document = await Document.create({
        emp_id,
        documentname: req.body.documentname.trim(),
        documenttype: req.body.documenttype,
        description: req.body.description || "",
        expiryDate: req.body.expiryDate || null,
        image: req.file.filename,
        verificationStatus: "Pending",
      });

      return res.status(201).json({
        message: "Document uploaded successfully.",
        documentRecord: document,
      });
    } catch (error) {
      if (req.file) removeUploadedFile(req.file.filename);

      console.error("Document upload error:", error);

      return res.status(500).json({
        message: "Unable to upload document.",
        error: error.message,
      });
    }
  }
);

// --------------------------------------------------
// PROFILE PICTURE DOCUMENTS
// GET /document/pic/:emp_id
// --------------------------------------------------

router.get("/pic/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;

    if (!isValidId(emp_id)) {
      return res.status(400).json({
        message: "Invalid employee ID.",
      });
    }

    const result = await Document.find({
      emp_id,
      documenttype: "Picture",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      profilepic: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch profile pictures.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// GET SINGLE DOCUMENT
// GET /document/singledoc/:_id
// --------------------------------------------------

router.get("/singledoc/:_id", async (req, res) => {
  try {
    const { _id } = req.params;

    if (!isValidId(_id)) {
      return res.status(400).json({
        message: "Invalid document ID.",
      });
    }

    const result = await Document.findById(_id);

    if (!result) {
      return res.status(404).json({
        message: "Document not found.",
      });
    }

    return res.status(200).json({
      documentDataByID: [result],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch document.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// GET ALL DOCUMENTS FOR ONE EMPLOYEE
// GET /document/:emp_id
// --------------------------------------------------

router.get("/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;

    if (!isValidId(emp_id)) {
      return res.status(400).json({
        message: "Invalid employee ID.",
      });
    }

    const result = await Document.find({ emp_id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      documentDataByEmpID: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch employee documents.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// GET ALL DOCUMENTS
// GET /document
// --------------------------------------------------

router.get("/", async (req, res) => {
  try {
    const result = await Document.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      documentData: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch documents.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// UPDATE DOCUMENT
// PUT /document/:_id
// PUT /document/editmydoc/:_id
// --------------------------------------------------

const updateDocument = async (req, res) => {
  let newFileName = req.file?.filename;

  try {
    const { _id } = req.params;

    if (!isValidId(_id)) {
      if (newFileName) removeUploadedFile(newFileName);

      return res.status(400).json({
        message: "Invalid document ID.",
      });
    }

    const existingDocument = await Document.findById(_id);

    if (!existingDocument) {
      if (newFileName) removeUploadedFile(newFileName);

      return res.status(404).json({
        message: "Document not found.",
      });
    }

    const validationError = validateDocumentFields(req.body);

    if (validationError) {
      if (newFileName) removeUploadedFile(newFileName);

      return res.status(400).json({
        message: validationError,
      });
    }

    const updateData = {
      documentname: req.body.documentname.trim(),
      documenttype: req.body.documenttype,
      description: req.body.description || "",
      expiryDate: req.body.expiryDate || null,
      verificationStatus:
        req.body.verificationStatus || "Pending",
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      _id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (req.file && existingDocument.image) {
      removeUploadedFile(existingDocument.image);
    }

    return res.status(200).json({
      message: "Document updated successfully.",
      updated_document: updatedDocument,
    });
  } catch (error) {
    if (newFileName) removeUploadedFile(newFileName);

    console.error("Document update error:", error);

    return res.status(500).json({
      message: "Unable to update document.",
      error: error.message,
    });
  }
};

router.put(
  "/editmydoc/:_id",
  upload.single("image"),
  updateDocument
);

router.put(
  "/:_id",
  upload.single("image"),
  updateDocument
);

// --------------------------------------------------
// DELETE DOCUMENT
// DELETE /document/:_id
// --------------------------------------------------

router.delete("/:_id", async (req, res) => {
  try {
    const { _id } = req.params;

    if (!isValidId(_id)) {
      return res.status(400).json({
        message: "Invalid document ID.",
      });
    }

    const deletedDocument = await Document.findByIdAndDelete(_id);

    if (!deletedDocument) {
      return res.status(404).json({
        message: "Document not found.",
      });
    }

    removeUploadedFile(deletedDocument.image);

    return res.status(200).json({
      message: "Document deleted successfully.",
      result: deletedDocument,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete document.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// MULTER ERROR HANDLER
// --------------------------------------------------

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "File size cannot exceed 10 MB."
          : error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  next();
});

module.exports = router;