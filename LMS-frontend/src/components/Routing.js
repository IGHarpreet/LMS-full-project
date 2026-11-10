import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import Attendance from "../components/Attendance";
import Leave from "../components/Leave";
import Employees from "../components/Employees";
import Edit from "../components/Edit";
import View from "../components/View";
import LeaveForm from "../components/LeaveForm";
import LeaveCalendar from "../components/LeaveCalendar";
import Documentation from "../components/Documentation";
import Projects from "../components/Projects";
import EmployeeProfile from "./EmployeeProfile";

import ChangePassword from "../components/ChangePassword";
import MyProfile from "./MyProfile";
import Adminhandleskill from "./adminhandleskill";
import EmployeeSkill from "./employeeskill";
import Announcements from "./Announcements";

const Routing = () => {
  return (
    <>
      <Routes>
        <Route exact path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/edit/:_id" element={<Edit />} />
        <Route path="/view/:_id" element={<View />} />
        <Route path="/leaveform" element={<LeaveForm />} />
        <Route path="/leavecalendar" element={<LeaveCalendar />} />
        <Route path="/profile/:id" element={<EmployeeProfile />} />
        <Route path="/adminhandleskill" element={<Adminhandleskill />} />
        <Route path="/employeeskill" element={<EmployeeSkill />} />
        <Route path="/profileemployee" element={<MyProfile />} />
        <Route path="/changepassword" element={<ChangePassword />} />
        <Route path="/documentation/:id" element={<Documentation />} />
        <Route path="/announcements" element={<Announcements />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

export default Routing;
