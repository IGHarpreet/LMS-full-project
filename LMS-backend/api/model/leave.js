const mongoose = require("mongoose");

leaveSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,

  emp_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  EmployeeName: String,
  // SupervisorName: {
  //   type: String,
  //   required: true,
  // },

  Department: {
    type: String,
    // required: true,
  },
  AppliedOn: {
    type: Date,
    default: Date.now,
  },
  LeaveType: {
    type: String,
    required: true,
    enum: ["Priviliege", "Sick", "Holiday", "Casual", "ShortLeave"],
  },
  Reason: {
    type: String,
    trim: true,
    default: "",
  },
  AdminRemarks: {
    type: String,
    trim: true,
    default: "",
  },
  LeaveDate: {
    type: String,
    required: true,
  },
  ReturnDate: String,
  TotalHoursRequested: String,
  TotalDaysRequested: String,
  ApprovalStatus: {
    type: String,
    enum: ["Pending", "Approved", "Denied"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Leave", leaveSchema);
