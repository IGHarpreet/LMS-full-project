import React, { useState } from "react";
import { Button } from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import LeaveTable from "./LeaveTable";
import LeaveCalendar from "./LeaveCalendar";
import EmployeeLeaveTable from "./EmployeeLeaveTable";
import EmployeeLeaveCalendar from "./EmployeeLeaveCalendar";
import PageHeader from "./PageHeader";
import { getUser } from "../utils/auth";

const Leave = () => {
  const navigate = useNavigate();
  const user = getUser() || {};
  const isManager = user.role === "admin" || user.role === "hr";

  // false = calendar, true = table (same defaults as before)
  const [adminTable, setAdminTable] = useState(false);
  const [employeeTable, setEmployeeTable] = useState(false);

  if (isManager) {
    return (
      <>
        <PageHeader title="Leave" subtitle="Review and manage leave requests across the team." />
        <div>
          <Button className="calendarbtn" onClick={() => setAdminTable(false)}>
            Calendar <EyeOutlined />
          </Button>
          <Button className="calendarbtn" onClick={() => setAdminTable(true)}>
            Table <EyeOutlined />
          </Button>
        </div>
        {adminTable ? <LeaveTable /> : <LeaveCalendar />}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My leave"
        subtitle="Apply for leave and track your requests."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/leaveform")}>
            Apply for leave
          </Button>
        }
      />
      <div>
        <Button className="calendarbtn" onClick={() => setEmployeeTable(false)}>
          Calendar <EyeOutlined />
        </Button>
        <Button className="calendarbtn" onClick={() => setEmployeeTable(true)}>
          Table <EyeOutlined />
        </Button>
      </div>
      {employeeTable ? <EmployeeLeaveTable /> : <EmployeeLeaveCalendar />}
    </>
  );
};

export default Leave;
