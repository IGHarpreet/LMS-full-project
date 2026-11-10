const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Skill = require("../model/skill");
const checkAuth = require("../middleware/check-auth");

// post skill api for employee
router.post("/", (req, res, next) => {
  const skill = new Skill({
    _id: new mongoose.Types.ObjectId(),
    emp_id: req.body.emp_id,
    skillname: req.body.skillname,
    skillExperience: req.body.skillExperience,
    skillrating: req.body.skillrating,
  });
  skill
    .save()
    .then((result) => {
      console.log(result);
      res.status(200).json({
        newSkill: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

// get all skills data of  single employee
router.get("/singleskill/:_id", (req, res, next) => {
  console.log(req.params._id);
  Skill.find({ _id: req.params._id })
    .then((result) => {
      res.status(200).json({
        SingleEmpAllData: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

// get by employee id

router.get("/emp/:emp_id", (req, res, next) => {
  console.log(req.params.emp_id);
  Skill.find({ emp_id: req.params.emp_id })
    .then((result) => {
      res.status(200).json({
        SingleSkillAllData: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

//get all skill data of employees

router.get("/", (req, res, next) => {
  Skill.find()
    .then((result) => {
      res.status(200).json({
        skilldata: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

//for delete single employee skill data by id

router.delete("/:id", (req, res, next) => {
  Skill.remove({ _id: req.params.id })
    .then((result) => {
      res.status(200).json({
        message: "Skill Record Deleted ",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
