const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Skill = require("../model/skill");
const checkAuth = require("../middleware/check-auth");

skillSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    ref: "User",
  },
  emp_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  skillname: String,
  skillExperience: String,
  skillrating: String,
});

module.exports = mongoose.model("Skill", skillSchema);
