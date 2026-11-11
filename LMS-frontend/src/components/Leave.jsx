
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

  const [adminTable, setAdminTable] = useState(false);
  const [employeeTable, setEmployeeTable] = useState(false);

  const isTable = isManager ? adminTable : employeeTable;
  const setView = isManager ? setAdminTable : setEmployeeTable;

  return (
    <div className="leave-main-container">
      <PageHeader
        title={isManager ? "Leave" : "My leave"}
        subtitle={
          isManager
            ? "Review and manage leave requests across the team."
            : "Apply for leave and track your requests."
        }
        extra={
          !isManager && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/leaveform")}
            >
              Apply for leave
            </Button>
          )
        }
      />

      <div className="leave-view-actions">
        <Button
          className={!isTable ? "calendarbtn active" : "calendarbtn"}
          onClick={() => setView(false)}
        >
          Calendar <EyeOutlined />
        </Button>

        <Button
          className={isTable ? "calendarbtn active" : "calendarbtn"}
          onClick={() => setView(true)}
        >
          Table <EyeOutlined />
        </Button>
      </div>

      <div className="leave-content">
        {isManager ? (
          adminTable ? <LeaveTable /> : <LeaveCalendar />
        ) : (
          employeeTable ? <EmployeeLeaveTable /> : <EmployeeLeaveCalendar />
        )}
      </div>
    </div>
  );
};

export default Leave;
