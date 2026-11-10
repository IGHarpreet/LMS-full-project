const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

assignedprojectSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    employeename: {
        type: String,
        ref: "User",
    },
    emp_id: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    project_id: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
        },
    ],
    assignedprojectname: String,
    assignedprojectdescription: String,
    assignedprojecttechnologies: String,
    assignedprojectstart: String,
    assignedprojectend: String,
    assignedprojectstatus: String,
});

module.exports = mongoose.model("Assigedproject", assignedprojectSchema);