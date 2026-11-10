const mongoose = require("mongoose");

holidaySchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  festival: {
    type: String,
    unique: true,
    required: true,
  },
  festivalDate: {
    type: String,
    unique: true,
    required: true,
  },
});






module.exports = mongoose.model("Holiday", holidaySchema);
