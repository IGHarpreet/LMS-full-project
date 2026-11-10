
import React, { useState } from "react";
import { Button } from "antd";

import {
  ScheduleOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import AttendanceCards from "./AttendanceCards";
import AttendanceTable from "./AttendanceTable";
import EmployeeAttendanceCalendar from "./EmployeeAttendanceCalendar";
import EmployeeAttendanceTable from "./EmployeeAttendanceTable";
import CompanyAttendanceCalendar from "./CompanyAttendanceCalendar";
import PageHeader from "./PageHeader";

import { getUser } from "../utils/auth";

const Attendance = () => {
  const user = getUser() || {};
  const isManager = user.role === "admin" || user.role === "hr";

  const [calendarView, setCalendarView] = useState(false);

  if (isManager) {
    // Show the company-wide calendar as a separate full-page view.
    if (calendarView) {
      return (
        <CompanyAttendanceCalendar
          onBack={() => setCalendarView(false)}
        />
      );
    }

    // Existing admin attendance dashboard remains unchanged.
    return (
      <>
        <PageHeader
          title="Attendance"
          subtitle="Who is in today, and the full attendance history."
          extra={
            <Button
              className="calendarbtn2"
              onClick={() => setCalendarView(true)}
            >
              <ScheduleOutlined />Calendar view
            </Button>
          }
        />

        <AttendanceCards />
        <AttendanceTable />
      </>
    );
  }

  // Existing employee attendance views remain unchanged.
  return (
    <>
      <PageHeader
        title="My attendance"
        subtitle="Your check-in history."
      />

      <div className="employee-attendance-view-toggle">
        <Button
          className="calendarbtn"
          type={calendarView ? "primary" : "default"}
          onClick={() => setCalendarView(true)}
        >
          Calendar <EyeOutlined />
        </Button>

        <Button
          className="calendarbtn"
          type={!calendarView ? "primary" : "default"}
          onClick={() => setCalendarView(false)}
        >
          Table <EyeOutlined />
        </Button>
      </div>

      {calendarView ? (
        <EmployeeAttendanceCalendar />
      ) : (
        <EmployeeAttendanceTable />
      )}
    </>
  );
};

export default Attendance;
