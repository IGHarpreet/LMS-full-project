const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Holiday = require("../model/holidays");
const checkAuth = require("../middleware/check-auth");
const { google } = require('googleapis');
require('dotenv').config();


const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
const calendarId = process.env.CALENDAR_ID;

// Google calendar API settings
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
];
const auth = new google.auth.JWT(
  CREDENTIALS.client_email,
  null,
  CREDENTIALS.private_key.replace(/\\n/g, "\n"),
  SCOPES
);
const calendar = google.calendar({
  version: "v3",
  auth,
});
const INDIAN_HOLIDAYS_CALENDAR_ID = "en.indian#holiday@group.v.calendar.google.com";

// Your TIMEOFFSET Offset
const TIMEOFFSET = '+05:30';


const dateTimeForCalander = () => {

  let date = new Date();

  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  if (month < 10) {
    month = `0${month}`;
  }
  let day = date.getDate();
  if (day < 10) {
    day = `0${day}`;
  }
  let hour = date.getHours();
  if (hour < 10) {
    hour = `0${hour}`;
  }
  let minute = date.getMinutes();
  if (minute < 10) {
    minute = `0${minute}`;
  }

  let newDateTime = `${year}-${month}-${day}T${hour}:${minute}:00.000${TIMEOFFSET}`;

  let event = new Date(Date.parse(newDateTime));

  let startDate = event;
  // Delay in end time is 1
  let endDate = new Date(new Date(startDate).setHours(startDate.getHours() + 1));

  return {
    'start': startDate,
    'end': endDate
  }
};
// console.log("dateTimeForCalander", dateTimeForCalander())


const insertEvent = async (event) => {

  try {
    let response = await calendar.events.insert({
      auth: auth,
      calendarId: calendarId,
      resource: event
    });

    if (response['status'] == 200 && response['statusText'] === 'OK') {
      return 1;
    } else {
      return 0;
    }
  } catch (error) {
    console.log(`Error at insertEvent --> ${error}`);
    return 0;
  }
};

let dateTime = dateTimeForCalander();

// Event for Google Calendar
let event = {
  'summary': `This is the summary.`,
  'description': `This is the description.`,
  'start': {
    'dateTime': dateTime['start'],
    'timeZone': 'Asia/Kolkata'
  },
  'end': {
    'dateTime': dateTime['end'],
    'timeZone': 'Asia/Kolkata'
  }
};




// Fetch events from the current year through the end of next year
const getEvents = async () => {
  const currentYear = new Date().getFullYear();

  const timeMin = new Date(
    `${currentYear}-01-01T00:00:00+05:30`
  ).toISOString();

  const timeMax = new Date(
    `${currentYear + 2}-01-01T00:00:00+05:30`
  ).toISOString();

  const calendarsToFetch = [
    {
      id: calendarId,
      source: "company",
    },
    {
      id: INDIAN_HOLIDAYS_CALENDAR_ID,
      source: "indian-holidays",
    },
  ];

  const results = await Promise.allSettled(
    calendarsToFetch.map(async (cal) => {
      const response = await calendar.events.list({
        calendarId: cal.id,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 2500,
      });

      return (response.data.items || []).map((event) => ({
        ...event,
        calendarSource: cal.source,
      }));
    })
  );

  let allEvents = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(
        `Fetched ${result.value.length} events from ${calendarsToFetch[index].source}`
      );

      allEvents = allEvents.concat(result.value);
    } else {
      console.error(
        `Failed to fetch ${calendarsToFetch[index].source}:`,
        result.reason.response?.data || result.reason.message
      );
    }
  });

  // Remove duplicate events
  const uniqueEvents = Array.from(
    new Map(
      allEvents.map((event) => [
        `${event.summary}_${event.start?.date || event.start?.dateTime}`,
        event,
      ])
    ).values()
  );

  console.log("TOTAL GOOGLE CALENDAR EVENTS:", uniqueEvents.length);

  return uniqueEvents;
};
// GET all Google Calendar events
router.get("/allindianholidays", async (req, res) => {
  try {
    const events = await getEvents();

    res.status(200).json({
      googleevents: events,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch Google Calendar events.",
      error: error.response?.data?.error?.message || error.message,
    });
  }
});




/**
 * @swagger
 * components:
 *     schema:
 *         holiday:
 *                type: object
 *                properties:
 *                    _id:
 *                        type: string
 *                    festival:
 *                        type: string
 *                    festivalDate:
 *                        type: string
 */


//================================================= POST holiday ==================================================
/**
 * @swagger
 * /holiday: 
 *  post:
 *      summary: Post/Add new holiday
 *      description: Post/Add new holiday
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/holiday'
 *      responses: 
 *          200:
 *              description: New holiday added successfully!
 */
// post holiday
router.post('/', (req, res, next) => {
  const holiday = new Holiday({
    _id: new mongoose.Types.ObjectId,
    festival: req.body.festival,
    festivalDate: req.body.festivalDate,

  })
  holiday.save()
    .then(result => {
      console.log(result);
      res.status(200).json({
        newHoliday: result
      })
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      })
    })
});
//================================================= POST holiday ==================================================







//================================================= GET holidays pending through out the year==================================================
/**
 * @swagger
 * /holiday: 
 *  get:
 *      summary: Get all holidays of the year
 *      description: Get all holidays of the year
 *      responses: 
 *          200:
 *              description: Success! Get All Holidays
 *              content: 
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/holiday'
 */
router.get("/", (req, res, next) => {

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
    festivalDate: {

      $gte: MyDateString,

    }

  };
  console.log(query)

  Holiday.find(query)
    .then((result) => {
      res.status(200).json({
        HolidaysPending: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//================================================= GET holidays pending through out the year==================================================

//================================================= GET particular holiday by ID==================================================
/**
 * @swagger
 * /holiday/{_id}: 
 *  get:
 *      summary: Get particular holiday by holidayID
 *      description: Get particular holiday by holidayID 
 *      parameters: 
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  ID required
 *            schema:
 *              type: string
 *      responses: 
 *          200:
 *              description: Click on try it out to get response
 *              content: 
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/holiday'
 */
// view single holiday
router.get("/:_id", (req, res, next) => {
  console.log(req.params._id);
  Holiday.findById(req.params._id)
    .then((result) => {
      res.status(200).json({
        holidayData: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});
//================================================= GET particular holiday by ID==================================================



//================================================= DELETE particular holiday by ID==================================================
/**
 * @swagger
 * /holiday/{_id}: 
 *  delete:
 *      summary: Delete particular holiday by holidayID
 *      description: Delete particular holiday by holidayID 
 *      parameters: 
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  holidayID required
 *            schema:
 *              type: string
 *      responses: 
 *          200:
 *              description: Success! Holiday Deleted
 */
// delete holiday
router.delete("/:_id", (req, res, next) => {
  Holiday.remove({ _id: req.params._id })
    .then((result) => {
      res.status(200).json({
        message: "Holiday Deleted",
        result: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
//================================================= DELETE particular holiday by ID==================================================



module.exports = router;

