const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

projectSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    employeename: {
        type: String,
        ref: "User",
    },
    // emp_id: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "User",
    //     },
    // ],
    projectname: String,
    projectdescription: String,
    projecttechnologies: String,
    projectstart: String,
    projectend: String,
    employees: Array,
});

module.exports = mongoose.model("Project", projectSchema);