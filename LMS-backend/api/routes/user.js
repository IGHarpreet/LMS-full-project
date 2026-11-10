const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../model/user");
const { OAuth2Client } = require("google-auth-library");
/**
 * @swagger
 * components:
 *     schema:
 *         user:
 *                type: object
 *                properties:
 *                    name:
 *                        type: string
 *                    password:
 *                        type: string
 *                    contact:
 *                        type: string
 *                    email:
 *                        type: string
 *                    gender:
 *                        type: string
 *                    role:
 *                        type: string
 */

//=============================================== user signup ====================================================
/**
 * @swagger
 * /user/signup:
 *  post:
 *      summary: Add new user
 *      description: Add new user
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/user'
 *      responses:
 *          200:
 *              description: Success! new user added
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/user'
 */

router.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      password: hashedPassword,
      contact: req.body.contact,
      email: req.body.email,
      gender: req.body.gender,
      role: req.body.role,

      department: req.body.department || req.body.Department || "",
      joiningDate: req.body.joiningDate || "",
      fatherName: req.body.fatherName || "",
      motherName: req.body.motherName || "",
      bloodGroup: req.body.bloodGroup || "",
      contactNumber: req.body.contactNumber || "",
      permanentAddress: req.body.permanentAddress || "",
      adharNumber: req.body.adharNumber || "",
      panNumber: req.body.panNumber || "",
      salary: req.body.salary || "",
      appraisal: req.body.appraisal || "",
      linkedinprofilelink: req.body.linkedinprofilelink || "",

      profilepicture: req.body.profilepicture || "",
      imageUrl: req.body.imageUrl || "",

      employeeskills: Array.isArray(req.body.employeeskills)
        ? req.body.employeeskills
        : [],
    });

    const result = await user.save();

    return res.status(201).json({
      new_user: result,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      message: "Unable to create user.",
      error: err.message,
    });
  }
});

//=============================================== user signup ====================================================

// ===============================================
const authenticate = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized." });
  }
};

//=============================================== user update ====================================================
/**
 * @swagger
 * /user/{_id}:
 *  put:
 *      summary: Update user
 *      description: Update user
 *      parameters:
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  userID required
 *            schema:
 *              type: string
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/user'
 *      responses:
 *          200:
 *              description: Success! user Updated
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/user'
 */
// update all data of an user
// ===============================================
// Update employee
// ===============================================

router.put("/:_id", authenticate, async (req, res) => {
  try {
    const { _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Invalid employee ID." });
    }

    const isAdmin = req.user?.role === "admin";
    const isSelf = String(req.user?._id) === String(_id);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Not allowed." });
    }

    // Fields anyone may edit on their own profile
    const selfEditableFields = [
      "name", "email", "contact", "gender",
      "fatherName", "motherName", "bloodGroup",
      "contactNumber", "permanentAddress",
      "linkedinprofilelink", "profilepicture", "imageUrl",
      "employeeskills",
    ];

    // Fields only admins may edit
    const adminOnlyFields = [
      "department", "joiningDate", "adharNumber", "panNumber",
      "salary", "appraisal",
    ];

    const allowedFields = isAdmin
      ? [...selfEditableFields, ...adminOnlyFields]
      : selfEditableFields;

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Normalize
    if (updateData.name !== undefined) {
      updateData.name = String(updateData.name).trim();
    }
    if (updateData.email !== undefined) {
      updateData.email = String(updateData.email).trim().toLowerCase();
    }
    if (updateData.salary !== undefined) {
      updateData.salary = String(updateData.salary).trim();
    }

    const updatedEmployee = await User.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    return res.status(200).json({
      message: "Employee updated successfully.",
      updated_employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Update employee error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "This email address is already registered." });
    }
    return res.status(500).json({
      message: "Unable to update employee.",
      error: error.message,
    });
  }
});
// Change user password
// ===============================================
router.put("/forchangepassword/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const { password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        message: "New password is required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully.",
    });

  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Unable to change password.",
      error: error.message,
    });
  }
});
// ===============================================
// Update employee ends
// ===============================================
//=============================================== user update ====================================================

//=============================================== get particular user ====================================================
/**
 * @swagger
 * /user/{_id}:
 *  get:
 *      summary: Get particular user by userID
 *      description: Get particular user by userID
 *      parameters:
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  userID required
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: Success! Get user
 */
// get user by id
router.get("/:_id", (req, res, next) => {
  console.log({ _id: req.params._id });
  User.find({ _id: req.params._id })
    .then((result) => {
      res.status(200).json({
        myData: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//=============================================== get particular user ====================================================

//=============================================== get all users ====================================================
/**
 * @swagger
 * /user:
 *  get:
 *      summary: Get all users
 *      description: Get all users
 *      responses:
 *          200:
 *              description: Success! Get all users
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/user'
 */
// get all users
router.get("/", (req, res, next) => {
  console.log("fetching all data");
  User.find()
    .then((result) => {
      res.status(200).json({
        userData: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//=============================================== get all users ====================================================
router.get("/foremployeerole", (req, res, next) => {
  console.log("fetching employee data exclude admin");
  User.find({ role: "employee" })
    .then((result) => {
      res.status(200).json({
        employeeData: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//=============================================== user login ====================================================
/**
 * @swagger
 * /user/login:
 *  post:
 *      summary: User login
 *      description: User login
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/user'
 *      responses:
 *          200:
 *              description: Success! login
 */


router.post("/login", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "");

    if (!name || !password) {
      return res.status(400).json({
        msg: "Username and password are required.",
      });
    }

    // Find username without case sensitivity
    const user = await User.findOne({
      name: {
        $regex: new RegExp(
          "^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
          "i"
        ),
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        msg: "Invalid username or password.",
      });
    }

    let isPasswordValid = false;

    const storedPassword = String(user.password);

    // Check bcrypt password
    if (/^\$2[aby]\$/.test(storedPassword)) {
      isPasswordValid = await bcrypt.compare(
        password,
        storedPassword
      );
    } else {
      // Legacy plain-text password
      isPasswordValid = password === storedPassword;

      // Convert old password into bcrypt hash
      if (isPasswordValid) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        msg: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      phone: user.contactNumber || user.contact,
      email: user.email,
      gender: user.gender,
      role: user.role,
      token,
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      msg: "Login failed.",
    });
  }
});


//=============================================== user login ====================================================

//=============================================== user google-login ====================================================
router.post("/googlelogin", (req, res) => {
  const { profileObj } = req.body;
  // let response = { "error": "Something is wrong", "code": "400" }

  console.log(req.body?.profileObj);
  const email = req.body?.profileObj?.email;
  const name = req.body?.profileObj?.name;
  const givenName = req.body?.profileObj?.givenName;
  const familyName = req.body?.profileObj?.familyName;
  const googleId = req.body?.profileObj?.googleId;
  const imageUrl = req.body?.profileObj?.imageUrl;

  if (email) {
    User.findOne({ email }).exec((err, user) => {
      if (err) {
        return res.status(500).json({
          error: "Something went wrong...",
        });
      } else {
        if (user) {
          const token = jwt.sign(
            {
              name: user[0].profileObj?.name,
              email: user[0].profileObj?.email,
            },
            "9263d55f3cf9fff7fe039ce6f40c8dbf0a0f6d7f4e10a734f779dd4c768ea3f5c7dd143442ef2ae45592a4a374b8bdf4b52313d16e6a0c8a121fe351f915e8c0", // SECRET KEY
            {
              expiresIn: "24h",
            }
          );
          res.status(200).json({
            name: user[0].profileObj?.name,
            email: user[0].profileObj?.email,
            token: token,
          });
        } else {
          const user = new User({
            _id: new mongoose.Types.ObjectId(),
            name: req.body?.profileObj?.name,
            email: req.body?.profileObj?.email,
            googleId: req.body?.profileObj?.googleId,
            imageUrl: req.body?.profileObj?.imageUrl,
          });

          user
            .save()
            .then((result) => {
              res.status(200).json({
                new_user: result,
              });
            })
            .catch((err) => {
              res.status(500).json({
                error: err,
              });
            });
        }
      }
    });
    // response = { "success": "User Already Exist", "code": 200 }
  }
});
//=============================================== user google-login ====================================================

//=============================================== delete user ====================================================
/**
 * @swagger
 * /user/empdel/{_id}:
 *  delete:
 *      summary: Delete particular user by userID
 *      description: Delete particular user by userID
 *      parameters:
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  userID required
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: Success! user deleted
 */
// delete user
router.delete("/empdel/:_id", (req, res, next) => {
  User.remove({ _id: req.params._id })
    .then((result) => {
      res.status(200).json({
        message: "User/Employee Deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
//=============================================== delete user ====================================================

//=============================================== send mail ====================================================
// Send Mail
router.post("/mail", (req, res) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ebsharpreetkaur@gmail.com",
      pass: "harpreet@1999",
    },
  });

  let info = transporter.sendMail({
    from: "ebsharpreetkaur@gmail.com",
    to: req.body.to,
    subject: req.body.subject,
    text: req.body.text,
  });
  if (info) {
    res.send("Mail sent Successfully.");
  } else {
    res.send("Error in sending mail.");
  }
});
//=============================================== send mail ====================================================

module.exports = router;
