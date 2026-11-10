const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Attendance = require("../model/attendance");
const checkAuth = require("../middleware/check-auth");
// const { query } = require("express");



/**
 * @swagger
 * components:
 *     schema:
 *         attendance:
 *                type: object
 *                properties:
 *                    name:
 *                        type: string
 *                    emp_id:
 *                        type: string
 *                    CheckIn:
 *                        type: string
 *                    TodayDate:
 *                        type: string
 *                    CheckOut:
 *                        type: string
 *                    Breaks:
 *                        type: array
 *                    eodoftheday:
 *                        type: array
 */



router.get("/todayattendance", (req, res, next) => {
  // date format "2022-10-02" with zero
  var MyDate = new Date();
  var MyDateString;
  MyDate.setDate(MyDate.getDate());
  MyDateString =
    MyDate.getFullYear() +
    "-" +
    ("0" + (MyDate.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + MyDate.getDate()).slice(-2);

  // if (req.Leave.ApprovalStatus == 'Approved') {
  var query = {
    TodayDate: {
      $gte: MyDateString,
      // $lte: new Date('2022-10-01').toISOString()
    },
    // ReturnDate: {
    //     //     // $gte: new Date('2022-10-09').toISOString(),
    //     $lte: currentDate
    // },
    // }
  };
  console.log(query);
  Attendance.find(query, function (err, data) {
    if (err) {
      return res.status(300).json("Error");
    } else {
      return res.status(200).json({ todayAttendance: data });
    }
  });
});

//============================================ POST attendance ==================================================
/**
 * @swagger
 * /attendance/{emp_id}: 
 *  post:
 *      summary: Post/Add new attendance
 *      description: Post/Add new attendance
 *      parameters: 
 *          - in: path
 *            name: emp_id
 *            required: true
 *            description: Employee ID required
 *            schema:
 *              type: string
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/attendance'
 *      responses: 
 *          200:
 *              description: Success! Check-in
 */
// attendance CheckIn/CheckOut
router.post("/:emp_id", (req, res, next) => {
  var MyDate = new Date();
  var MyDateString;
  MyDate.setDate(MyDate.getDate());
  MyDateString =
    MyDate.getFullYear() +
    "-" +
    ("0" + (MyDate.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + MyDate.getDate()).slice(-2);

  Attendance.find({ emp_id: req.params.emp_id, TodayDate: MyDateString }).then(
    (result) => {
      if (result.length >= 1) {
        console.log("todayDate result during attendance POST", result);
        res.status(404).json({
          msg: "You have already checked-in",
        });
      } else {
        const attendance = new Attendance({
          _id: new mongoose.Types.ObjectId(),
          emp_id: req.body.emp_id,
          name: req.body.name,
          CheckIn: req.body.CheckIn,
          CheckOut: req.body.CheckOut,
          Breaks: req.body.Breaks,
          TodayDate: req.body.TodayDate,
        });
        attendance
          .save()
          .then((result) => {
            console.log(result);
            res.status(200).json({
              newAttendance: result,
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({
              error: err,
            });
          });
      }
    }
  );
});


//=========================================== GET All Attendance =================================================
/**
 * @swagger
 * /attendance: 
 *  get:
 *      summary: Get all attendance 
 *      description: Get all attendance 
 *      responses: 
 *          200:
 *              description: Success! Get All attendance
 *              content: 
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/attendance'
 */
router.get("/", (req, res, next) => {
  Attendance.find()
    .then((result) => {
      res.status(200).json({
        attendanceData: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//=========================================== GET All Attendance =================================================


// ========================================== DELETE Attendance by ID==================================================
/**
 * @swagger
 * /attendance/{_id}: 
 *  delete:
 *      summary: Delete particular attendance by attendanceID
 *      description: Delete particular attendance by attendanceID 
 *      parameters: 
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  attendanceID required
 *            schema:
 *              type: string
 *      responses: 
 *          200:
 *              description: Success! Attendance Deleted
 */
// delete Leave
router.delete("/:id", (req, res, next) => {
  Attendance.remove({ _id: req.params.id })
    .then((result) => {
      res.status(200).json({
        message: "Attendance Deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
// ========================================== DELETE Attendance by ID ==================================================

// ========================================= GET All attendance of particular Employee=================================
/**
 * @swagger
 * /attendance/{emp_id}: 
 *  get:
 *      summary: Get particular attendance by EmployeeID
 *      description: Get particular attendance by EmployeeID 
 *      parameters: 
 *          - in: path
 *            name: emp_id
 *            required: true
 *            description:  Employee ID required
 *            schema:
 *              type: string
 *      responses: 
 *          200:
 *              description: Success! GET Attendance by EmployeeID
 *              content: 
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/attendance'
 */
// Get all Attendance of employee
router.get("/employee/:emp_id", (req, res, next) => {
  var MyDate = new Date();
  var MyDateString;
  MyDate.setDate(MyDate.getDate());
  MyDateString =
    MyDate.getFullYear() +
    "-" +
    ("0" + (MyDate.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + MyDate.getDate()).slice(-2);

  console.log(req.params.emp_id);
  Attendance.find({ emp_id: req.params.emp_id, TodayDate: MyDateString })
    .then((result) => {
      res.status(200).json({
        attendanceDataByEmpID: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
// ========================================= GET All attendance of particular Employee=================================

// ========================================= GET all attendance of employee ========================================== 
/**
 * @swagger
 * /attendance/{emp_id}: 
 *  get:
 *      summary: Get all attendance of single employee
 *      description: Get all attendance of single employee 
 *      parameters: 
 *          - in: path
 *            name: emp_id
 *            required: true
 *            description:  Employee ID required
 *            schema:
 *              type: string
 *      responses: 
 *          200:
 *              description: Success! GET Attendance of single employee
 *              content: 
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/attendance'
 */
// Get all Attendance of employee
router.get("/singlemploy/:emp_id", (req, res, next) => {
  console.log(req.params.emp_id);
  Attendance.find({ emp_id: req.params.emp_id })
    .then((result) => {
      res.status(200).json({
        SingleEmployeeAllAttendance: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
// ========================================= GET all attendance of employee ========================================== 

// ========================================= GET single attendance of employee ========================================== 
router.get("/single/:_id", (req, res, next) => {
  console.log(req.params._id);
  Attendance.find({ _id: req.params._id })
    .then((result) => {
      res.status(200).json({
        SingleAttendance: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
// ========================================= GET single attendance of employee ========================================== 

// ========================================= GET Today attendance by attendanceID ========================================== 
/**
 * @swagger
 * /attendance/{_id}: 
 *  get:
 *      summary: Get particular attendance by attendanceID
 *      description: Get particular attendance by attendanceID 
 *      parameters: 
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  attendanceID required
 *            schema:
 *              type: string
 *      responses: 
 *          200:
 *              description: Success! Get Attendance 
 */
// Get Cuurent Date Attendance
router.get("/record/:_id", (req, res, next) => {
  console.log(req.params._id);
  var MyDate = new Date();
  var MyDateString;
  MyDate.setDate(MyDate.getDate());
  MyDateString =
    MyDate.getFullYear() +
    "-" +
    ("0" + (MyDate.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + MyDate.getDate()).slice(-2);

  var query = {
    _id: req.params._id,
    TodayDate: {
      $gte: MyDateString,
    },
  };
  console.log("new Date ", query);

  Attendance.find(query)
    .then((result) => {
      res.status(200).json({
        attendanceDataByID: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
// ========================================= GET Today attendance by attendanceID ========================================== 

// =========================================== Get Attendance by Daterange/name/All =============================
// Employee Attendance Report
router.post("/", (req, res, next) => {
  const { TodayDate } = req.body;
  console.log("Check data here ", req.body?.TodayDate);
  Start = req.body?.TodayDate?.Start;
  End = req.body?.TodayDate?.End;

  // Start = req.body.TodayDate[0]
  // End = req.body.TodayDate[1]
  console.log("Start", Start);
  console.log("End", End);

  if (req.body.TodayDate) {
    // console.log("TodayDate", req.body.TodayDate)
    Attendance.find({ TodayDate: { $gte: Start, $lte: End } })
      .then((result) => {
        res.status(200).json({
          AttendanceDataByDateRange: result,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  } else if (req.body.name) {
    console.log(req.body.name);
    Attendance.find({ name: req.body.name })
      .then((result) => {
        res.status(200).json({
          attendanceDataByName: result,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  } else {
    Attendance.find()
      .then((result) => {
        res.status(200).json({
          attendanceRecord: result,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  }
});
// =========================================== Get Attendance by Daterange/name/All =============================


// =========================================== Update Attendance by attendanceID =============================
/**
 * @swagger
 * /attendance/{_id}: 
 *  put:
 *      summary: Edit attendance
 *      description: Edit attendance
 *      parameters: 
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  attendanceID required
 *            schema:
 *              type: string
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/attendance'
 *      responses: 
 *          200:
 *              description: Success! attendance Updated
 *              content: 
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/leave'
 */
// update employee attendance
router.put("/addon/:_id", (req, res, next) => {
  console.log(req.params._id);
  Attendance.findOneAndUpdate(
    { _id: req.params._id },
    {
      $set: {
        CheckIn: req.body.CheckIn,
        CheckOut: req.body.CheckOut,
        Breaks: req.body.Breaks,
        eodoftheday: req.body.eodoftheday,
      },
    }
  )
    .then((result) => {
      res.status(200).json({
        updatedAttendance: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
// =========================================== Update Attendance by attendanceID =============================

module.exports = router;
