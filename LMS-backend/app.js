var express = require("express");
var app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const dotenv = require("dotenv")
const pdfMaster = require("pdf-master");
const PDFDocument = require('pdfkit');
const fs = require('fs')
const excelJS = require("exceljs");
const doc = new PDFDocument;
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const multer = require('multer')
const Attendance = require("./api/model/attendance");
const router = express.Router();
const csv = require("json2csv");
const { parse } = require("json2csv");
// const lib = require('messagemedia-messages-sdk');
dotenv.config({ path: path.resolve(__dirname, './.env') })

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));
app.use(express.urlencoded({ extended: false }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './api/public/monthly_attendance_report/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname)
  }
})

const upload = multer({
  storage: storage,
  // limits: {
  //     fileSize: 1024  1024  5      // 5 MB
  // },
  // fileFilter: fileFilter
})


mongoose.set("strictQuery", true);

mongoose.connect(process.env.MONGODB_URI).catch((err) => {
  // server.js also connects and exits on failure; this just avoids an unhandled rejection
  console.error("MongoDB connection error:", err.message);
});




//-----------------------------------------------------------------------------------------------------------------------------
// Cron for pdf/excel attendance
// * * * * * *
// | | | | | |
// | | | | | day of the week
// | | | | month
// | | | day of the month
// | | hour
// | minute
// second (optional)

// let transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "ebsharpreetkaur@gmail.com",
//     pass: "uhhkctbnfqckgkgn",
//   },
// });
cron.schedule("* * * * *", function () {
  // console.log("---------------------");
  // console.log("Running Cron process");


  try {
    // console.log("file response")
    let counter = 1
    // let dates = Date.now() + Math.round(Math.random() * 1E9) + "monthly_attendance.csv"

    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    var MyDateString;
    var MyDate = new Date(firstDay);
    MyDate.setDate(MyDate.getDate());
    MyDateString =
      MyDate.getFullYear() +
      "-" +
      ("0" + (MyDate.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + MyDate.getDate()).slice(-2);

    var MyDateStringforlast;
    var MyDateforlast = new Date(lastDay);
    MyDateforlast.setDate(MyDateforlast.getDate());
    MyDateStringforlast =
      MyDateforlast.getFullYear() +
      "-" +
      ("0" + (MyDateforlast.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + MyDateforlast.getDate()).slice(-2);

    // console.log("first Date of month", MyDateString);
    // console.log("last Date of month", MyDateStringforlast);

    var query = {
      TodayDate: {
        $gte: MyDateString,
        $lte: MyDateStringforlast,
      },

    };
    // console.log(query);
    Attendance.find(query)
      .then((result) => {
        // console.log("result", result)
        const fields = ["name", "emp_id", "CheckIn", "TodayDate", "CheckOut"]
        const opts = { fields }

        try {
          // console.log("processing..");

          const csv = parse(result, opts)
          fs.writeFile(`./api/public/monthly_attendance_report/monthly_attendance.csv`, csv, function (error) {
            if (error) throw error;
            // console.log("write successfully");
          });
          // console.log("csv :", csv);
          // console.log("result :", result);

        } catch (err) {
          // console.log(err)
        }

        let messageOptions = {
          from: "ebsharpreetkaur@gmail.com",
          to: "ebsharpreetkaur@gmail.com",
          subject: "Scheduled Email",
          text: "Hello user! This email has been scheduled to be automatically sent out, every Monday",
          attachments: [
            {
              filename: "monthly_attendance.csv",
              path: './api/public/monthly_attendance_report/monthly_attendance.csv',
              cid: 'uniq-monthly_attendance.csv'
            }
          ]
        };

        // transporter.sendMail(messageOptions, function (error, info) {
        //   if (error) {
        //     throw error;
        //   } else {
        //     console.log("Email sended!");
        //   }
        // });



      })
      .catch((err) => {
        // console.log(err);

      });

  } catch (error) {
    console.log("error")

  }

  // fs.unlink('./cron/pdf.log', err => {
  // if (err) throw err;
  // console.log('Pdf generated successfully!');
});



app.get('/exportattendance', function (req, res, next) {

  try {
    console.log("file response")
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly attendance");
    worksheet.columns = [

      { header: "S.no", key: "s_no" },
      { header: "Attendance ID", key: "_id" },
      { header: "Employee ID", key: "emp_id" },
      { header: "Name", key: "name" },
      { header: "Check-in", key: "CheckIn" },
      { header: "Check-out", key: "CheckOut" },
      // { header: "Breaks", key: "Breaks" },
      { header: "Date", key: "TodayDate" },

    ]

    let counter = 1
    Attendance.find()
      .then((result) => {
        console.log("result", result)
        // attendancealldata.push(result)
        result.forEach((attendance) => {
          attendance.s_no = counter;
          worksheet.addRow(attendance);
          counter++;
        })
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true }
        })
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=attendancedata.xlsx`
        )
        return workbook.xlsx.write(res).then(() => {
          console.log("res")
          console.log(workbook.xlsx)
          res.status(200);
        })
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });

  } catch (error) {
    console.log("error")
    res.send({ status: false, meassage: error });
  }

});
// });

// let pdfDoc = new PDFDocument;
// pdfDoc.pipe(fs.createWriteStream('SampleDocument.pdf'));
// pdfDoc.text("My Sample PDF Document");
// pdfDoc.end();
//-----------------------------------------------------------------------------------------------------------------------------

const userRoute = require("./api/routes/user");
const leaveRoute = require("./api/routes/leave");
const documentRoute = require("./api/routes/document");
const attendanceRoute = require("./api/routes/attendance");
const holidayRoute = require("./api/routes/holidays");
const projectRoute = require("./api/routes/project");
const skillRoute = require("./api/routes/skill");
const assignedprojectsRoute = require("./api/routes/assignedprojects")
const handleskillRoute = require("./api/routes/handleskill");
const attendance = require("./api/model/attendance");
const announcementsRoute = require("./api/routes/announcements");


// Function to serve all static files
// inside public directory.
// var publicDir = require("path").join(__dirname, "api/public");
// app.use(express.static(publicDir));
const publicDir = path.join(__dirname, "api", "public");
app.use(express.static(publicDir));

mongoose.connection.on("error", (err) => {
  console.log("DB connection failed");
});

mongoose.connection.on("connected", (connected) => {
  console.log("Connected with database ");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// for attendance pdf reqport
// app.get("/pdf", async (req, res) => {
//   console.log("req pdf", req)
//   var PDF = await pdfMaster.generatePdf("template.hbs");

//   res.contentType("application/pdf");
//   res.status(200).send(PDF);
// });



// Swagger Setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Leave Management System",
      version: "1.0.0",
    },
    servers: [
      {
        url: `${process.env.NODE_BASE_URL}`,
      },
    ],
  },
  apis: [
    "./api/routes/holidays.js",
    "./api/routes/leave.js",
    "./api/routes/attendance.js",
    "./api/routes/document.js",
    "./api/routes/user.js",
    "./api/routes/skill.js",
    "./api/routes/handleskill.js",
  ],
};
const swaggerSpec = swaggerJSDoc(options);
app.use("/apidocs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Swagger Setup

// API end points
app.use("/user", userRoute);
app.use("/leave", leaveRoute);
app.use("/document", documentRoute);
app.use("/attendance", attendanceRoute);
app.use("/holiday", holidayRoute);
app.use("/project", projectRoute);
app.use("/skill", skillRoute);
app.use("/assignproject", assignedprojectsRoute);
app.use("/handleskill", handleskillRoute);
app.use("/announcements", announcementsRoute);

// simple health check (used by the frontend / uptime monitors)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});


app.use((req, res, next) => {
  res.status(404).json({
    error: "Bad Request",
  });
});

// last-resort error handler: always answer with JSON instead of an HTML stack trace
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ msg: err.message || "Internal server error" });
});

module.exports = app;
