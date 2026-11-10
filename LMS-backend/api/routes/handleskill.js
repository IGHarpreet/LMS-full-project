const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const handleSkill = require("../model/handleskill");
const checkAuth = require("../middleware/check-auth");

//add skill fields for only admin
router.post("/addfield", (req, res, next) => {
  const handleskill = new handleSkill({
    _id: new mongoose.Types.ObjectId(),
    emp_id: req.body.emp_id,
    skillList: req.body.skillList,
  });
  handleskill
    .save()
    .then((result) => {
      console.log(result);
      res.status(200).json({
        AdditionalSkill: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

//put api for update skill

router.put("/update/:_id", (req, res, next) => {
  handleSkill
    .findOneAndUpdate(
      { _id: req.params._id },
      {
        skillList: req.body.skillList,
      }
    )
    .then((result) => {
      res.status(200).json({
        updated_skill: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

// get list of skills provided by admin
router.get("/newListSkill", (req, res, next) => {
  handleSkill
    .find()
    .then((result) => {
      res.status(200).json({
        skillListData: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

//skillList delete by admin
router.delete("/:id", (req, res, next) => {
  handleSkill
    .remove({ _id: req.params.id })
    .then((result) => {
      res.status(200).json({
        message: "Skill List Deleted ",
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
