
import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  DatePicker,
  Col,
  message,
  Select,
} from "antd";
import axios from "axios";
import jwt_decode from "../utils/jwtSafe";
import { useNavigate } from "react-router-dom";
import { send } from "emailjs-com";
import { getUser } from "../utils/auth";
import "../../src/LeaveForm.css";
import PageHeader from "./PageHeader";
import { useEffect } from "react";

const { Option } = Select;

const LeaveForm = () => {
  const [form] = Form.useForm();
  const [size] = useState("large");

  const user = getUser() || {};
  const navigate = useNavigate();

  const [EmployeeName, setEmployeeName] = useState(user?.name || "");
  const [SupervisorName, setSupervisorName] = useState("");
  const [Department, setDepartment] = useState("");
  const [LeaveType, setLeaveType] = useState("");
  const [LeaveDate, setLeaveDate] = useState("");
  const [ReturnDate, setReturnDate] = useState("");
  const [TotalHoursRequested, setTotalHoursRequested] = useState("");
  const [TotalDaysRequested, setTotalDaysRequested] = useState("");
  const [status, setStatus] = useState("");
  const [Reason, setReason] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  function handleClick() {
    navigate("/Leave");
  }

  const employeedata = async () => {
    try {
      const token = localStorage.getItem("access_token1");

      if (!token) return;

      const decoded = jwt_decode(token);

      await axios.get(
        `${process.env.REACT_APP_BASE_URL}/leave/${decoded?._id}`
      );
    } catch (error) {
      console.error("Employee data error:", error);
    }
  };
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const token = (localStorage.getItem("access_token1") || "").replace(/^["']|["']$/g, "");

        const res = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/announcements/meta/departments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setDepartments(res.data?.departments || []);

        // Pre-select the employee's own department
        const mine = res.data?.myDepartment;
        if (mine) {
          form.setFieldsValue({ department: mine });
          setDepartment(mine);
        }
      } catch (error) {
        console.error("Department load error:", error);
        message.warning("Unable to load departments.");
      } finally {
        setDepartmentsLoading(false);
      }
    };

    loadDepartments();
  }, [form]);
  const applyLeave = async (values) => {
    try {
      const token = localStorage.getItem("access_token1");

      if (!token) {
        message.error("Session expired. Please login again.");
        return;
      }

      const decoded = jwt_decode(token);

      const employeeName = values.employeeName;
      const department = values.department;
      const leaveType = values.leaveType;
      const leaveDate = values.leaveDate.format("YYYY-MM-DD");
      const returnDate = values.returnDate.format("YYYY-MM-DD");
      const leaveDuration = values.leaveDuration;


      const payload = {
        emp_id: decoded._id,
        EmployeeName: employeeName,
        Department: department,
        LeaveType: leaveType,
        LeaveDate: leaveDate,
        ReturnDate: returnDate,
        TotalHoursRequested: leaveDuration,
        TotalDaysRequested,
        status,
        Reason: values.Reason.trim(),
      };

      // Save leave application
      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/leave`,
        payload
      );

      setEmployeeName(employeeName);
      setDepartment(department);
      setLeaveType(leaveType);
      setLeaveDate(leaveDate);
      setReturnDate(returnDate);
      setTotalHoursRequested(leaveDuration);

      message.success("Leave applied successfully");

      // Send email through EmailJS
      try {
        await send(
          "service_zoq6iqx",
          "template_qty2hso",
          {
            EmployeeName: employeeName,
            Department: department,
            LeaveType: leaveType,
            LeaveDate: leaveDate,
          },
          "-RwS8VfPlegnHNjxc"
        );

        message.success("Email notification sent");
      } catch (emailError) {
        console.error("EmailJS Error:", emailError);
        message.warning(
          "Leave submitted, but email notification could not be sent."
        );
      }

      await employeedata();
      navigate("/Leave");

    } catch (error) {
      console.error("Apply Leave Error:", error);

      if (error.response) {
        message.error(
          error.response.data?.message || "Unable to apply leave."
        );
      } else {
        message.error("Unable to apply leave. Please try again.");
      }
    }
  };

  const today = new Date();

  return (
    <div className="leave-page">

      {/* Date and Time */}
      <PageHeader title={<div className="leave-card-info">
        <div className="leave-heading-row">
          <h2>Leave Application</h2>
          <span className="leave-request-badge">NEW REQUEST</span>
        </div>



        <div className="leave-info-divider"></div>
      </div>} subtitle={<p>
        Fill in the details below to submit your leave request.
      </p>} />

      {/* Leave Application Card */}
      <div className="leave-application-card">



        {/* Right Side - Form */}
        <div className="leave-card-form">

          <Form
            form={form}
            name="leaveApplication"
            layout="vertical"
            autoComplete="off"
            initialValues={{
              employeeName: EmployeeName,
            }}
            onFinish={applyLeave}
            onFinishFailed={() => {
              message.error("Please fill in all required fields before applying for leave.");
            }}
          >

            <Row gutter={[18, 2]}>

              {/* Employee Name */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="employeeName"
                  rules={[
                    {
                      required: true,
                      message: "Please enter employee name",
                    },
                    {
                      pattern: /^[a-zA-Z\s.'-]+$/,
                      message: "Please enter a valid name",
                    },
                  ]}
                >
                  <Input
                    className="leave-input"
                    placeholder="Employee Name"
                    onChange={(e) =>
                      setEmployeeName(e.target.value)
                    }
                  />
                </Form.Item>
              </Col>
              {/* Reason for Leave */}
              <Col xs={24}>
                <Form.Item
                  name="Reason"
                  label="Reason for Leave"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "Please enter the reason for leave",
                    },
                    {
                      max: 500,
                      message: "Reason cannot exceed 500 characters",
                    },
                  ]}
                >
                  <Input.TextArea
                    className="leave-reason-textarea"
                    placeholder="Please explain why you need leave..."
                    rows={3}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Col>
              {/* Department */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="department"
                  rules={[
                    {
                      required: true,
                      message: "Please select department",
                    },
                  ]}
                >
                  <Select
                    className="leave-select"
                    placeholder="Select Department"
                    loading={departmentsLoading}
                    showSearch
                    onChange={setDepartment}
                    options={departments.map((d) => ({ value: d, label: d }))}
                  />
                </Form.Item>
              </Col>

              {/* Leave Date */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="leaveDate"
                  rules={[
                    {
                      required: true,
                      message: "Please select start date",
                    },
                  ]}
                >
                  <DatePicker
                    className="leave-date-picker"
                    placeholder="From"
                    format="DD-MM-YYYY"
                    onChange={(value) =>
                      setLeaveDate(
                        value ? value.format("YYYY-MM-DD") : ""
                      )
                    }
                  />
                </Form.Item>
              </Col>

              {/* Leave Type */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="leaveType"
                  rules={[
                    {
                      required: true,
                      message: "Please select leave type",
                    },
                  ]}
                >
                  <Select
                    className="leave-select"
                    placeholder="Select Leave Type"
                    onChange={setLeaveType}
                  >
                    <Option value="Priviliege">Priviliege</Option>
                    <Option value="Sick">Sick</Option>
                    <Option value="Casual">Casual</Option>
                  </Select>
                </Form.Item>
              </Col>

              {/* Return Date */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="returnDate"
                  rules={[
                    {
                      required: true,
                      message: "Please select end date",
                    },
                  ]}
                >
                  <DatePicker
                    className="leave-date-picker"
                    placeholder="To"
                    format="DD-MM-YYYY"
                    onChange={(value) =>
                      setReturnDate(
                        value ? value.format("YYYY-MM-DD") : ""
                      )
                    }
                  />
                </Form.Item>
              </Col>

              {/* Leave Duration */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="leaveDuration"
                  rules={[
                    {
                      required: true,
                      message: "Please select leave duration",
                    },
                  ]}
                >
                  <Select
                    className="leave-select"
                    placeholder="Select Leave Duration"
                    onChange={setTotalHoursRequested}
                    options={[
                      {
                        label: "Full Day",
                        value: "full day",
                      },
                      {
                        label: "Half Day",
                        options: [
                          {
                            label: "1st Half",
                            value: "1st half",
                          },
                          {
                            label: "2nd Half",
                            value: "2nd half",
                          },
                        ],
                      },
                      {
                        label: "Short Leave",
                        options: [
                          {
                            label: "1 Hour",
                            value: "1 hour",
                          },
                          {
                            label: "2 Hours",
                            value: "2 hour",
                          },
                        ],
                      },
                    ]}
                  />
                </Form.Item>
              </Col>

            </Row>

            {/* Buttons */}
            <div className="leave-form-footer">

              <Button
                className="leave-back-button"
                size={size}
                onClick={handleClick}
              >
                Back
              </Button>

              <Button
                className="leave-apply-button"
                type="primary"
                htmlType="submit"
                size={size}
              >
                Apply for Leave
              </Button>

            </div>

          </Form>
        </div>
      </div>
    </div>
  );
};

export default LeaveForm;
