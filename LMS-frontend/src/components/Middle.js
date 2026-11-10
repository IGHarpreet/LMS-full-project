import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

const LABELS = {
  dashboard: "Dashboard",
  attendance: "Attendance",
  employees: "Employees",
  leave: "Leave",
  leaveform: "Apply for leave",
  leavecalendar: "Leave calendar",
  projects: "Projects",
  employeeskill: "Skills",
  adminhandleskill: "Skills",
  profileemployee: "My profile",
  profile: "Profile",
  changepassword: "Change password",
  documentation: "Documents",
  edit: "Edit",
  view: "View",
};

/** Breadcrumb trail derived from the URL. */
const Middle = () => {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "dashboard")) return null;

  return (
    <Breadcrumb className="ebs-breadcrumb">
      <Breadcrumb.Item>
        <Link to="/dashboard">Home</Link>
      </Breadcrumb.Item>
      {parts[0] && LABELS[parts[0]] && <Breadcrumb.Item>{LABELS[parts[0]]}</Breadcrumb.Item>}
    </Breadcrumb>
  );
};

export default Middle;
