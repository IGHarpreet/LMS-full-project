
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  message,
  Select,
  Card,
  Tag,
  Alert,
  Spin,
} from "antd";
import {
  UserOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import jwt_decode from "../utils/jwtSafe";
import { useNavigate } from "react-router-dom";
import { send } from "emailjs-com";
import { getUser } from "../utils/auth";
import PageHeader from "./PageHeader";
import "../../src/LeaveForm.css";

const { TextArea } = Input;

const LeaveForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const user = getUser() || {};

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedDuration, setSelectedDuration] = useState("");

  // Watch form values so the preview updates automatically.
  const watchedStartDate = Form.useWatch("leaveDate", form);
  const watchedEndDate = Form.useWatch("returnDate", form);
  const watchedDuration = Form.useWatch("leaveDuration", form);

  const employeeName = user?.name || "";

  const BASE_URL = process.env.REACT_APP_BASE_URL;

  // Normalize authentication token.
  const getToken = () =>
    (localStorage.getItem("access_token1") || "")
      .replace(/^["']|["']$/g, "")
      .trim();

  // Calculate requested leave days.
  const calculateLeaveDays = (startDate, endDate, duration) => {
    if (!startDate || !endDate || !duration) return 0;

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) return 0;

    if (duration === "1st half" || duration === "2nd half") {
      return 0.5;
    }

    if (duration === "1 hour" || duration === "2 hour") {
      return 0;
    }

    if (end.isBefore(start, "day")) return 0;

    return end.startOf("day").diff(start.startOf("day"), "day") + 1;
  };

  const previewDays = calculateLeaveDays(
    watchedStartDate,
    watchedEndDate,
    watchedDuration
  );

  // Load employee department information.
  useEffect(() => {
    let active = true;

    const loadDepartments = async () => {
      try {
        const token = getToken();

        if (!token) {
          message.error("Session expired. Please login again.");
          return;
        }

        const response = await axios.get(
          `${BASE_URL}/announcements/meta/departments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!active) return;

        const departmentList = response.data?.departments || [];

        setDepartments(departmentList);

        const myDepartment = response.data?.myDepartment;

        if (myDepartment) {
          form.setFieldsValue({
            department: myDepartment,
          });
        }
      } catch (error) {
        console.error("Department loading error:", error);

        if (active) {
          message.warning("Unable to load departments.");
        }
      } finally {
        if (active) {
          setDepartmentsLoading(false);
        }
      }
    };

    loadDepartments();

    return () => {
      active = false;
    };
  }, [form, BASE_URL]);

  // Refresh employee leave data.
  const employeedata = async () => {
    try {
      const token = getToken();

      if (!token) return;

      const decoded = jwt_decode(token);

      if (!decoded?._id) return;

      await axios.get(`${BASE_URL}/leave/${decoded._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Employee leave refresh error:", error);
    }
  };

  // Prevent selecting past dates.
  const disablePastDates = (current) => {
    return (
      current &&
      current.startOf("day").isBefore(dayjs().startOf("day"))
    );
  };

  // Prevent return date before start date or today.
  const disableReturnDates = (current) => {
    if (!current) return false;

    const beforeToday = current
      .startOf("day")
      .isBefore(dayjs().startOf("day"));

    const startDate = form.getFieldValue("leaveDate");

    const beforeStartDate =
      startDate &&
      current.startOf("day").isBefore(dayjs(startDate).startOf("day"));

    return beforeToday || beforeStartDate;
  };

  // Handle start date change.
  const handleStartDateChange = (date) => {
    const returnDate = form.getFieldValue("returnDate");
    const duration = form.getFieldValue("leaveDuration");

    if (
      date &&
      returnDate &&
      dayjs(returnDate).isBefore(dayjs(date), "day")
    ) {
      form.setFieldsValue({
        returnDate: null,
      });
    }

    if (
      date &&
      ["1st half", "2nd half", "1 hour", "2 hour"].includes(duration)
    ) {
      form.setFieldsValue({
        returnDate: date,
      });
    }

    form.validateFields(["returnDate"]).catch(() => {});
  };

  // Handle duration change.
  const handleDurationChange = (value) => {
    setSelectedDuration(value);

    const startDate = form.getFieldValue("leaveDate");

    if (
      startDate &&
      ["1st half", "2nd half", "1 hour", "2 hour"].includes(value)
    ) {
      form.setFieldsValue({
        returnDate: startDate,
      });
    }
  };

  // Submit leave application.
  const applyLeave = async (values) => {
    if (submitting) return;

    console.log("FORM SUBMITTED:", values);

    const startDate = dayjs(values.leaveDate);
    const endDate = dayjs(values.returnDate);

    if (!startDate.isValid() || !endDate.isValid()) {
      message.error("Please select valid leave dates.");
      return;
    }

    if (endDate.isBefore(startDate, "day")) {
      message.error("Return date cannot be before leave start date.");
      return;
    }

    const employee = values.employeeName?.trim();
    const department = values.department;
    const leaveType = values.leaveType;
    const leaveDuration = values.leaveDuration;
    const reason = values.Reason?.trim();

    if (
      !employee ||
      !department ||
      !leaveType ||
      !leaveDuration ||
      !reason
    ) {
      message.error("Please complete all required fields.");
      return;
    }

    const token = getToken();

    if (!token) {
      message.error("Session expired. Please login again.");
      return;
    }

    setSubmitting(true);

    try {
      const decoded = jwt_decode(token);

      if (!decoded?._id) {
        message.error("Unable to identify employee. Please login again.");
        return;
      }

      const leaveDate = startDate.format("YYYY-MM-DD");
      const returnDate = endDate.format("YYYY-MM-DD");

      const totalDays = calculateLeaveDays(
        startDate,
        endDate,
        leaveDuration
      );

      // Keep backend field names unchanged.
      const payload = {
        emp_id: decoded._id,
        EmployeeName: employee,
        Department: department,
        LeaveType: leaveType,
        LeaveDate: leaveDate,
        ReturnDate: returnDate,
        TotalHoursRequested: leaveDuration,
        TotalDaysRequested: totalDays,
        status: "Pending",
        Reason: reason,
      };

      console.log("Leave application payload:", payload);

      // Submit to backend.
      const response = await axios.post(
        `${BASE_URL}/leave`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Leave API response:", response.data);

      message.success("Leave application submitted successfully!");

      // EmailJS notification only. No Twilio.
      try {
        await send(
          "service_zoq6iqx",
          "template_qty2hso",
          {
            EmployeeName: employee,
            Department: department,
            LeaveType: leaveType,
            LeaveDate: leaveDate,
          },
          "-RwS8VfPlegnHNjxc"
        );
      } catch (emailError) {
        console.error("EmailJS notification error:", emailError);

        message.warning(
          "Leave submitted successfully, but the email notification could not be sent."
        );
      }

      await employeedata();

      form.resetFields();

      navigate("/Leave");
    } catch (error) {
      console.error("Apply Leave Error:", error);
      console.error("API error response:", error.response?.data);

      message.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to apply for leave. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const leaveTypes = [
    { label: "Privilege Leave", value: "Priviliege" },
    { label: "Sick Leave", value: "Sick" },
    { label: "Casual Leave", value: "Casual" },
  ];

  const durationOptions = [
    {
      label: "Full Day",
      options: [
        { label: "Full Day", value: "full day" },
      ],
    },
    {
      label: "Half Day",
      options: [
        { label: "First Half", value: "1st half" },
        { label: "Second Half", value: "2nd half" },
      ],
    },
    {
      label: "Short Leave",
      options: [
        { label: "1 Hour", value: "1 hour" },
        { label: "2 Hours", value: "2 hour" },
      ],
    },
  ];

  return (
    <div className="leave-page">
      <PageHeader
        title={
          <div className="leave-page-heading">
            <div className="leave-heading-icon">
              <CalendarOutlined />
            </div>

            <div>
              <div className="leave-heading-row">
                <h2>Leave Application</h2>
                <Tag color="blue">NEW REQUEST</Tag>
              </div>

              <p>Submit and manage your time-off request.</p>
            </div>
          </div>
        }
        subtitle="Complete the form below with your leave details."
      />

      <div className="leave-form-container">
        <div className="leave-form-topbar">
          <div>
            <h3>Apply for Leave</h3>
            <p>Provide accurate information for faster approval.</p>
          </div>

          <Tag color="processing">
            <ClockCircleOutlined /> Pending Approval
          </Tag>
        </div>

        <Card className="leave-application-card" bordered={false}>
          <Form
            form={form}
            name="leaveApplication"
            layout="vertical"
            autoComplete="off"
            initialValues={{
              employeeName,
            }}
            onFinish={applyLeave}
            onFinishFailed={(errorInfo) => {
              console.error("FORM VALIDATION FAILED:", errorInfo);
              console.error(
                "CURRENT FORM VALUES:",
                form.getFieldsValue(true)
              );

              message.error("Please complete all required fields.");
            }}
          >
            {/* Employee information */}
            <div className="leave-section-heading">
              <div className="leave-section-icon">
                <UserOutlined />
              </div>

              <div>
                <h4>Employee Information</h4>
                <p>Your basic employee details</p>
              </div>
            </div>

            <Row gutter={[20, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="employeeName"
                  label="Employee Name"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "Please enter employee name.",
                    },
                    {
                      pattern: /^[a-zA-Z\s.'-]+$/,
                      message: "Please enter a valid name.",
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Enter employee name"
                    className="leave-input"
                    maxLength={80}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="department"
                  label="Department"
                  rules={[
                    {
                      required: true,
                      message: "Please select your department.",
                    },
                  ]}
                >
                  <Select
                    className="leave-select"
                    placeholder="Select department"
                    loading={departmentsLoading}
                    notFoundContent={
                      departmentsLoading ? (
                        <Spin size="small" />
                      ) : (
                        "No departments found"
                      )
                    }
                    showSearch
                    optionFilterProp="label"
                    options={departments.map((department) => ({
                      value: department,
                      label: department,
                    }))}
                    suffixIcon={<ApartmentOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="leave-form-divider" />

            {/* Leave details */}
            <div className="leave-section-heading">
              <div className="leave-section-icon">
                <CalendarOutlined />
              </div>

              <div>
                <h4>Leave Details</h4>
                <p>Select your leave type, dates and duration</p>
              </div>
            </div>

            <Row gutter={[20, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="leaveType"
                  label="Leave Type"
                  rules={[
                    {
                      required: true,
                      message: "Please select leave type.",
                    },
                  ]}
                >
                  <Select
                    className="leave-select"
                    placeholder="Select leave type"
                    options={leaveTypes}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="leaveDuration"
                  label="Leave Duration"
                  rules={[
                    {
                      required: true,
                      message: "Please select leave duration.",
                    },
                  ]}
                >
                  <Select
                    className="leave-select"
                    placeholder="Select duration"
                    options={durationOptions}
                    onChange={handleDurationChange}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="leaveDate"
                  label="Leave Start Date"
                  rules={[
                    {
                      required: true,
                      message: "Please select start date.",
                    },
                  ]}
                >
                  <DatePicker
                    className="leave-date-picker"
                    placeholder="Select start date"
                    format="DD-MM-YYYY"
                    disabledDate={disablePastDates}
                    onChange={handleStartDateChange}
                    style={{ width: "100%" }}
                    suffixIcon={<CalendarOutlined />}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="returnDate"
                  label="Return Date"
                  dependencies={["leaveDate"]}
                  rules={[
                    {
                      required: true,
                      message: "Please select return date.",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const start = getFieldValue("leaveDate");

                        if (
                          !value ||
                          !start ||
                          !dayjs(value).isBefore(dayjs(start), "day")
                        ) {
                          return Promise.resolve();
                        }

                        return Promise.reject(
                          new Error(
                            "Return date cannot be before start date."
                          )
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="leave-date-picker"
                    placeholder="Select return date"
                    format="DD-MM-YYYY"
                    disabledDate={disableReturnDates}
                    style={{ width: "100%" }}
                    suffixIcon={<CalendarOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Duration preview */}
            {watchedDuration && watchedStartDate && watchedEndDate && (
              <div className="leave-duration-preview">
                <CheckCircleOutlined />

                <div>
                  <strong>
                    {previewDays > 0
                      ? `${previewDays} ${
                          previewDays === 1 ? "Day" : "Days"
                        } Requested`
                      : watchedDuration === "1 hour" ||
                        watchedDuration === "2 hour"
                      ? "Short Leave Requested"
                      : "Select valid dates"}
                  </strong>

                  <span>
                    Calculated based on your selected leave dates and duration.
                  </span>
                </div>
              </div>
            )}

            <div className="leave-form-divider" />

            {/* Reason */}
            <div className="leave-section-heading">
              <div className="leave-section-icon">
                <FileTextOutlined />
              </div>

              <div>
                <h4>Reason for Leave</h4>
                <p>Tell your manager why you need time off</p>
              </div>
            </div>

            <Form.Item
              name="Reason"
              label="Leave Reason"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Please provide a reason for leave.",
                },
                {
                  min: 5,
                  message: "Please provide at least 5 characters.",
                },
                {
                  max: 500,
                  message: "Reason cannot exceed 500 characters.",
                },
              ]}
            >
              <TextArea
                className="leave-reason-textarea"
                placeholder="Describe the reason for your leave..."
                rows={4}
                maxLength={500}
                showCount
                autoSize={{
                  minRows: 3,
                  maxRows: 6,
                }}
              />
            </Form.Item>

            {/* Information */}
            <Alert
              className="leave-info-alert"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message="Before submitting"
              description="Please check your leave dates and details carefully. Your request will be sent for manager/HR approval."
            />

            {/* Footer - MUST remain inside Form */}
            <div className="leave-form-footer">
              <Button
                className="leave-back-button"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/Leave")}
                disabled={submitting}
              >
                Back
              </Button>

              <Button
                className="leave-apply-button"
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={submitting}
                disabled={departmentsLoading}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Leave Request"}
              </Button>
            </div>
          </Form>
        </Card>

        <div className="leave-form-bottom-note">
          <InfoCircleOutlined />
          <span>
            Your leave request will appear in My Leave once submitted.
          </span>
        </div>
      </div>
    </div>
  );
};

export default LeaveForm;
