const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const handleSkill = require("../model/handleskill");
const checkAuth = require("../middleware/check-auth");

handleskillSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  emp_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  skillList: String,
});

module.exports = mongoose.model(" Handle Skill", handleskillSchema);
