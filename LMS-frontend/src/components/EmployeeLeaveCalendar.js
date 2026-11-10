import { Calendar, Popover } from "antd";
import React, { useState, useEffect } from "react";
import "antd/dist/antd.css";
import jwt_decode from "../utils/jwtSafe";
import moment from "moment";
import "../../src/LeaveCalendar.css";

const LeaveCalendar = () => {
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [employeeLeavelisiting, setEmployeeLeaveLisiting] = useState([]);
  const [together, setTogether] = useState();

  // Normalize approval status
  const getStatus = (status) => {
    const normalized = String(status || "Pending").trim().toLowerCase();

    if (normalized === "approved") return "approved";
    if (normalized === "denied" || normalized === "rejected") return "rejected";

    return "pending";
  };

  const getStatusLabel = (status) => {
    const normalized = getStatus(status);

    if (normalized === "approved") return "Approved";
    if (normalized === "rejected") return "Rejected";

    return "Pending";
  };

  useEffect(() => {
    const employeeleavedata = () => {
      const token = localStorage.getItem("access_token1");

      if (!token) {
        console.error("Authentication token not found");
        return;
      }

      const decoded = jwt_decode(token);

      fetch(`${process.env.REACT_APP_BASE_URL}/leave/${decoded._id}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch leave data");
          }

          return response.json();
        })
        .then((data) => {
          if (data?.leaveByEmpID?.length > 0) {
            const updatedLeaves = data.leaveByEmpID.map((leave) => {
              function getDates(startDate, endDate) {
                const dates = [];

                let currentDate = moment(startDate).startOf("day");
                const lastDate = moment(endDate).startOf("day");

                if (!currentDate.isValid() || !lastDate.isValid()) {
                  return dates;
                }

                while (currentDate.isSameOrBefore(lastDate, "day")) {
                  dates.push({
                    leavedatelist: currentDate.format("YYYY-MM-DD"),
                    leavetype: leave.LeaveType,
                    ApprovalStatus: leave.ApprovalStatus,
                    _id: leave._id,
                  });

                  currentDate = currentDate.clone().add(1, "day");
                }

                return dates;
              }

              const dates = getDates(
                leave?.LeaveDate,
                leave?.ReturnDate
              );

              return {
                ...leave,
                leaveDatesinRange: dates,
              };
            });

            setEmployeeLeaves(updatedLeaves);
            setEmployeeLeaveLisiting(updatedLeaves);
          } else {
            setEmployeeLeaves([]);
            setEmployeeLeaveLisiting([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching employee leaves:", error);
        });
    };

    employeeleavedata();
  }, []);

  // Summary counts (number of requests, not leave days)
  const pendingCount = employeeLeaves.filter(
    (leave) => getStatus(leave.ApprovalStatus) === "pending"
  ).length;

  const approvedCount = employeeLeaves.filter(
    (leave) => getStatus(leave.ApprovalStatus) === "approved"
  ).length;

  const rejectedCount = employeeLeaves.filter(
    (leave) => getStatus(leave.ApprovalStatus) === "rejected"
  ).length;

  // Leave details popup
  const leaveDetails = (leave) => {
    const duration =
      leave.TotalHoursRequested ||
      (leave.TotalDaysRequested
        ? `${leave.TotalDaysRequested} days`
        : "Not specified");

    return (
      <div className="leave-popover-content">
        <div className="leave-popover-heading">
          {leave.LeaveType || "Leave"}
        </div>

        <div className="leave-detail-row">
          <span>Approval status</span>
          <strong className={`status-text ${getStatus(leave.ApprovalStatus)}`}>
            {getStatusLabel(leave.ApprovalStatus)}
          </strong>
        </div>

        <div className="leave-detail-row">
          <span>From date</span>
          <strong>
            {moment(leave.LeaveDate).isValid()
              ? moment(leave.LeaveDate).format("DD MMM YYYY")
              : "-"}
          </strong>
        </div>

        <div className="leave-detail-row">
          <span>Return date</span>
          <strong>
            {moment(leave.ReturnDate).isValid()
              ? moment(leave.ReturnDate).format("DD MMM YYYY")
              : "-"}
          </strong>
        </div>

        <div className="leave-detail-row">
          <span>Duration</span>
          <strong>{duration}</strong>
        </div>

        {(leave.Reason || leave.LeaveReason || leave.Description) && (
          <div className="leave-detail-reason">
            <span>Reason</span>
            <p>
              {leave.Reason || leave.LeaveReason || leave.Description}
            </p>
          </div>
        )}

        {leave.AdminRemarks && (
          <div className="leave-detail-reason">
            <span>Admin remarks</span>
            <p>{leave.AdminRemarks}</p>
          </div>
        )}
      </div>
    );
  };

  const dateFullCellRender = (value) => {
    const stringValue = value.format("YYYY-MM-DD");

    // Find all leave records covering this date
    const arr = [];

    for (let y = 0; y < employeeLeaves.length; y++) {
      if (employeeLeaves[y]?.leaveDatesinRange?.length > 0) {
        for (
          let t = 0;
          t < employeeLeaves[y].leaveDatesinRange.length;
          t++
        ) {
          arr.push(employeeLeaves[y].leaveDatesinRange[t]);
        }
      }
    }

    const newArray = arr.filter(
      (el) => el.leavedatelist === stringValue
    );

    // Determine background color based on status
    const hasApproved = newArray.some(
      (item) => getStatus(item.ApprovalStatus) === "approved"
    );

    const hasPending = newArray.some(
      (item) => getStatus(item.ApprovalStatus) === "pending"
    );

    const hasRejected = newArray.some(
      (item) => getStatus(item.ApprovalStatus) === "rejected"
    );

    let dateClass = "";

    if (hasApproved) {
      dateClass = "leave-approved-date";
    } else if (hasPending) {
      dateClass = "leave-pending-date";
    } else if (hasRejected) {
      dateClass = "leave-rejected-date";
    }

    return (
      <div
        className={`ant-picker-calendar-date leave-calendar-date ${dateClass}`}
      >
        <div className="ant-picker-calendar-date-value">
          {value.date()}
        </div>

        <div className="ant-picker-calendar-date-content">
          {newArray.map((item, index) => {
            const leave = employeeLeaves.find(
              (leave) => String(leave._id) === String(item._id)
            );

            if (!leave) return null;

            const status = getStatus(leave.ApprovalStatus);

            return (
              <Popover
                key={`${item._id}-${index}`}
                content={leaveDetails(leave)}
                title={null}
                trigger="click"
                placement="top"
              >
                <div
                  className={`leave-calendar-chip leave-chip-${status}`}
                >
                  <span>{item.leavetype || "Leave"}</span>
                  <span className="leave-chip-status">
                    {getStatusLabel(item.ApprovalStatus)}
                  </span>
                </div>
              </Popover>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="leave-calendar-wrapper">

      {/* Summary cards */}
      <div className="leave-summary-cards">

        <div className="leave-summary-card pending-card">
          <div className="summary-label">Pending Requests</div>
          <div className="summary-count">{pendingCount}</div>
        </div>

        <div className="leave-summary-card approved-card">
          <div className="summary-label">Approved Requests</div>
          <div className="summary-count">{approvedCount}</div>
        </div>

        <div className="leave-summary-card rejected-card">
          <div className="summary-label">Rejected Requests</div>
          <div className="summary-count">{rejectedCount}</div>
        </div>

      </div>

      {/* Calendar legend */}
      <div className="leave-calendar-legend">
        <span>
          <i className="legend-dot approved-dot"></i>
          Approved
        </span>

        <span>
          <i className="legend-dot pending-dot"></i>
          Pending
        </span>

        <span>
          <i className="legend-dot rejected-dot"></i>
          Rejected
        </span>
      </div>

      <Calendar dateFullCellRender={dateFullCellRender} />
    </div>
  );
};

export default LeaveCalendar;