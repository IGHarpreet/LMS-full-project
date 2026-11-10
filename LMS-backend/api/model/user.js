const mongoose = require("mongoose"); //adding db

userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  googleId: String,
  name: String,
  password: String,
  contact: Number,
  email: {
    type: String,
    uppercase: false,
    lowercase: true,
    unique: true,
  },
  gender: String,
  imageUrl: String,
department: {
  type: String,
  trim: true,
},
  role: {
    type: String,
    uppercase: false,
    lowercase: true,
    enum: ["admin", "employee", "hr"],
    default: "employee"
  },
  joiningDate: {
    type: String,
    // required: true,
  },
  fatherName: {
    type: String,
    // required: true,
  },
  motherName: {
    type: String,
    // required: true,
  },
  bloodGroup: {
    type: String,
    // required: true,
  },
  contactNumber: {
    type: String,
    // required: true,
  },
  permanentAddress: {
    type: String,
    // required: true,
  },
  adharNumber: {
    type: String,
    // required: true,
  },
  panNumber: {
    type: String,
    // required: true,
  },
  salary: {
    type: String,
    // required: true,
  },
  appraisal: {
    type: String,
    // required: true,
  },
  linkedinprofilelink: String,
  profilepicture: String,
  employeeskills: Array,
});

module.exports = mongoose.model("user", userSchema);
