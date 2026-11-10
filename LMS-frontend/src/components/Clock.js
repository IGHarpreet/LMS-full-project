import React, { useState, useEffect } from "react";
import { Button, Dropdown, Menu, Space, Select, Typography, theme, Calendar, Badge } from "antd";
import axios from "axios";
import jwt_decode from '../utils/jwtSafe';
import {
  MinusCircleOutlined,
  PlusOutlined,
  DownOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  CheckCircleOutlined,
  HeartOutlined,
  SmileOutlined
} from "@ant-design/icons";
import "../../src/EODModal.css";
import moment, { duration } from "moment";
import { Col, Row, Modal, Card, Input, Form, message } from "antd";
import { LoginOutlined, LogoutOutlined, ClockCircleOutlined } from "@ant-design/icons";
import PageHeader from "./PageHeader";
import StatCard from "./StatCard";
import { getErrorMessage } from "../shared/api";
import Meta from "antd/lib/card/Meta";
import Title from "antd/lib/typography/Title";
const { Text, Link } = Typography;


const Clock = () => {
  const [date, setDate] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
  const [TodayAttendance, setTodayAttendance] = useState([]);
  const [disableCheckin, setDisableCheckin] = React.useState();
  const [disableCheckout, setDisableCheckout] = React.useState();
  const [disablebreak, setDisableBreak] = React.useState();
  const [EmployeeCheckIn, setEmployeeCheckIn] = useState([]);
  const [attendanceAll, setAttendanceAll] = useState([]);
  let newTime = new Date().toLocaleTimeString();
  const [ctime, setCTime] = useState(newTime);
  const [eodForm] = Form.useForm();
  const [eod, setEod] = useState("");
  // console.log("hiiiiiiiii", eod);

  const [timespent, setTimespent] = useState("");
  const [timeconsumed, setTtimeconsumed] = useState("");

  const [EmployeeCheckOut, setEmployeeCheckOut] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTimer, setIsTimer] = useState(false);
  const [objects, setObjects] = useState({});
  const [show, setShow] = useState();
  const [name, setName] = useState("");
  const [whichtime, setWhichtime] = useState("");
  const [tokendata, settokendata] = useState("");
  // const { token } = theme.useToken();


  useEffect(() => {
    const token = localStorage.getItem("access_token1");
    var decoded = jwt_decode(token);
    settokendata(decoded)
    var today = new Date()
    var curHr = today.getHours()
    if (curHr < 12) {
      setWhichtime("morning")
    }
    else if (curHr < 18) {
      setWhichtime("afternoon")
    }
    else {
      setWhichtime("evening")
    }

  }, []);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const showTimer = () => {
    setIsTimer(false);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    // setDisableCheckout(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const refreshClock = () => {
    setDate(new Date());
  };
  useEffect(() => {
    const timerId = setInterval(refreshClock, 1000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  const handleTime = () => {
    newTime = new Date().toLocaleTimeString();
    setCTime(newTime);
  };

  useEffect(() => {
    const id = setInterval(handleTime, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // network errors are already toasted globally (shared/api.js)
  const notifyError = (e) => {
    if (e && !e.response && e.isAxiosError) return;
    message.error(getErrorMessage(e, "Action failed. Please try again."));
  };



  //---------------------------------------------Employee Attendance GET by id API----------------------------------------------------------
  useEffect(() => {
    const LoggedAttendanceAllRecord = async () => {
      try {
        const token = localStorage.getItem("access_token1");
        const decoded = jwt_decode(token);

        const res = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/attendance/employee/${decoded._id}`
        );

        const records = res?.data?.attendanceDataByEmpID || [];

        // Get today's date in YYYY-MM-DD format
        const today = moment().format("YYYY-MM-DD");

        // Find only today's attendance record
        const todayRecord = records.find(
          (record) => record.TodayDate === today
        );

        if (!todayRecord) {
          // No attendance record today
          setAttendance(null);
          setTodayAttendance("");
          setDisableCheckin(false);
          setDisableCheckout(true);
          setDisableBreak(true);
          setShow(true);
          return;
        }

        setAttendance(todayRecord);

        const isCheckedIn = Boolean(todayRecord.CheckIn);
        const isCheckedOut = Boolean(todayRecord.CheckOut);

        // Employee can check in only once per day
        setDisableCheckin(isCheckedIn);

        // Checkout is available only after check-in
        setDisableCheckout(!isCheckedIn || isCheckedOut);

        // Break is available only while working
        setDisableBreak(!isCheckedIn || isCheckedOut);

        // Calculate working time
        if (isCheckedIn) {
          const startTime = moment(todayRecord.CheckIn, "h:mm:ss A");
          const endTime = isCheckedOut
            ? moment(todayRecord.CheckOut, "h:mm:ss A")
            : moment();

          let diff = moment.duration(endTime.diff(startTime));

          // Handle overnight time difference
          if (diff.asMilliseconds() < 0) {
            endTime.add(1, "day");
            diff = moment.duration(endTime.diff(startTime));
          }

          const hours = Math.floor(diff.asMinutes() / 60);
          const minutes = Math.floor(diff.asMinutes() % 60);

          setTodayAttendance(
            `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} hours`
          );
        }

        // Break status
        const breaks = todayRecord.Breaks || [];

        if (isCheckedOut || breaks.length === 0) {
          setShow(true);
        } else {
          const lastBreak = breaks[breaks.length - 1];
          setShow(Boolean(lastBreak.end));
        }

      } catch (err) {
        console.error(
          "Could not load today's attendance:",
          err?.message
        );
      }
    };

    LoggedAttendanceAllRecord();
  }, []);
  //---------------------------------------------Employee Attendance GET by id API----------------------------------------------------------

  //-------------------------------------------- Attendance Checkin---------------------------------------------------------------

  const employeecheckin = async () => {
    try {
      const token = localStorage.getItem("access_token1");

      if (!token) {
        message.error("Please log in again.");
        return;
      }

      const decoded = jwt_decode(token);

      // Today's date
      const TodayDate = moment().format("YYYY-MM-DD");

      // Current check-in time
      const CheckIn = new Date().toLocaleTimeString();

      const CheckOut = "";
      const Breaks = [];
      const eodoftheday = [];
      const emp_id = decoded._id;

      // Get employee profile picture
      const userRes = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/user/${decoded._id}`
      );

      const myprofilepic =
        userRes?.data?.myData?.profilepicture || "";

      // Save attendance
      const res = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/attendance/${emp_id}`,
        {
          name: decoded.name,
          emp_id,
          TodayDate,
          CheckIn,
          CheckOut,
          Breaks,
          eodoftheday,
          myprofilepic
        }
      );

      // Get the newly created attendance record
      const newRecord = res?.data?.newAttendance;

      if (!newRecord) {
        message.error("Check-in response was not received. Please refresh and verify your attendance.");
        return;
      }

      // IMPORTANT: Update attendance state immediately
      setAttendance(newRecord);

      // Keep existing state updates
      setEmployeeCheckIn(newRecord);
      setTodayAttendance("00:00 hours");

      setDisableCheckin(true);
      setDisableCheckout(false);
      setDisableBreak(false);

      setShow(true);

      message.success(`Checked in successfully at ${newRecord.CheckIn || CheckIn}`);
      window.dispatchEvent(new Event("attendance-updated"));
    } catch (error) {
      console.error("Check-in error:", error);
      notifyError(error);
    }
  };

  //-------------------------------------------- Attendance Checkin---------------------------------------------------------------

  //-------------------------------------------- Attendance Break---------------------------------------------------------------

  const employeebreak = async () => {
    let Breaks = attendance?.Breaks;
    const employ = attendance?._id;
    const myprofilepic = attendance?.profilepicture;
    var eodoftheday = [];
    // console.log("attendance id in break", attendance?._id);
    const CheckIn = attendance?.CheckIn;
    const CheckOut = "";

    if (attendance?.Breaks[Breaks.length - 1]?.end === "") {
      Breaks[Breaks.length - 1].end = new Date().toLocaleTimeString();
      // console.log("Breaks/endTime", attendance?.Breaks[Breaks.length - 1]?.end);
    } else {
      const obj = {
        key: Math.floor(Math.random() * 9785874563463865),
        start: new Date().toLocaleTimeString(),
        end: "",
        timeconsumed: timeconsumed,
      };
      // console.log("Breaks/startTime", obj.start);
      attendance?.Breaks.push(obj);
    }
    await axios
      .put(`${process.env.REACT_APP_BASE_URL}/attendance/addon/${employ}`, {
        CheckIn,
        Breaks,
        CheckOut,
        eodoftheday,
        myprofilepic
      })

      .then((res) => {
        setObjects(res?.data?.updatedAttendance);
        // console.log("Breaks Response", res);
        // console.log("Breaks", Breaks);
      });

    setShow(!show);
  };
  //-------------------------------------------- Attendance Break---------------------------------------------------------------

  //-------------------------------------------- Attendance Checkout---------------------------------------------------------------
  const onFinish = async (value) => {
    // console.log("Received values of form:", value);
    // console.log("checkout", attendance?.CheckOut);

    if (attendance?.CheckOut === "") {
      const CheckIn = attendance?.CheckIn;
      // console.log("i am here attendance checkin spread", CheckIn);
      const CheckOut = new Date().toLocaleTimeString();
      const Breaks = attendance?.Breaks;
      const myprofilepic = attendance?.profilepicture;

      const eodoftheday = value.users;
      // console.log("eodoftheday", eodoftheday);

      const ID = attendance?._id;
      // console.log("attendance id in checkout", ID);

      await axios
        .put(`${process.env.REACT_APP_BASE_URL}/attendance/addon/${ID}`, {
          CheckIn,
          CheckOut,
          Breaks,
          eodoftheday,
          myprofilepic
        })
        .then((res) => {
          setEmployeeCheckOut(res?.data?.updatedAttendance);
          window.location.reload();
          setDisableCheckout(true);
        });
    } else {
      window.alert("you have already Checked-Out");
    }
  };
  //-------------------------------------------- Attendance Checkout---------------------------------------------------------------
  const userData = () => {
    const token = localStorage.getItem("access_token1");
    // console.log("token from local storage:", token);
    // let token = token;
    var decoded = jwt_decode(token);
    // console.log("Decoded token data", decoded);
    setName(decoded);
  };











  //=====================================================================================================================================================================
  return (
    <>
      <PageHeader
        title={`Good ${whichtime || "day"}, ${tokendata.name || "there"}`}
        subtitle="Your attendance for today"
      />

      <div className="ebs-stats">
        <StatCard
          label="Check-in"
          value={attendance?.CheckIn || ""}
          icon={<LoginOutlined />}
          tone="green"
        />
        <StatCard
          label="Check-out"
          value={attendance?.CheckOut || ""}
          icon={<LogoutOutlined />}
          tone="amber"
        />
        <StatCard
          label="Hours worked"
          value={Array.isArray(TodayAttendance) ? "" : TodayAttendance}
          icon={<ClockCircleOutlined />}
          tone="blue"
        />
      </div>

      <Modal
        title={
          <div className="eod-modal-heading">
            <span className="eod-modal-title">End of Day Report</span>
            <span className="eod-modal-subtitle">
              Add a description of the work you completed today.
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={650}
        centered
        destroyOnClose={false}
        maskClosable={false}
        className="eod-modal"
      >
        <Form
          form={eodForm}
          name="dynamic_form_nest_item"
          layout="vertical"
          initialValues={{ users: [{}] }}
          onFinish={(values) => onFinish(values).catch(notifyError)}
          autoComplete="off"
        >
          <Form.List name="users">
            {(fields, { add, remove }) => (
              <>
                <div className="eod-work-list">
                  {fields.map(({ key, name, ...restField }, index) => (
                    <div className="eod-work-item" key={key}>
                      <div className="eod-work-item-header">
                        <span className="eod-work-number">
                          Work item {index + 1}
                        </span>

                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <Row gutter={[16, 8]} align="top">
                        <Col xs={24} sm={17}>
                          <Form.Item
                            {...restField}
                            name={[name, "eod"]}
                            label="Work description"
                            rules={[
                              {
                                required: true,
                                whitespace: true,
                                message: "Please describe the work you completed.",
                              },
                            ]}
                          >
                            <Input.TextArea
                              className="eod-description-input"
                              placeholder="Describe the tasks you completed today..."
                              autoSize={{ minRows: 3, maxRows: 6 }}
                              maxLength={1000}
                              showCount
                              onChange={(e) => setEod(e.target.value)}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={7}>
                          <Form.Item
                            {...restField}
                            name={[name, "time spent"]}
                            label="Time spent"
                            rules={[
                              {
                                required: true,
                                message: "Please select time.",
                              },
                            ]}
                          >
                            <Select
                              className="eod-time-select"
                              placeholder="Select time"
                              onChange={(value) => setTimespent(value)}
                              options={[
                                { value: "10 min", label: "10 minutes" },
                                { value: "20 min", label: "20 minutes" },
                                { value: "30 min", label: "30 minutes" },
                                { value: "40 min", label: "40 minutes" },
                                { value: "50 min", label: "50 minutes" },
                                { value: "1 hour", label: "1 hour" },
                                { value: "2 hour", label: "2 hours" },
                                { value: "3 hour", label: "3 hours" },
                                { value: "4 hour", label: "4 hours" },
                                { value: "5 hour", label: "5 hours" },
                                { value: "6 hour", label: "6 hours" },
                                { value: "7 hour", label: "7 hours" },
                                { value: "8 hour", label: "8 hours" },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>

                <Form.Item className="eod-add-work-item">
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => add({})}
                  >
                    Add another work item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div className="eod-modal-footer">
            <Button onClick={handleCancel} size="large">
              Cancel
            </Button>

            <Button type="primary" htmlType="submit" size="large">
              Submit EOD
            </Button>
          </div>
        </Form>
      </Modal>

      <div className="parent ebs-actions">
        <div className="child">
          <Button
            className="checkinBtn"
            onClick={employeecheckin}
            disabled={disableCheckin}
          >
            Check in
          </Button>
        </div>
        <div className="child">
          <Button
            // className="breakBtn"
            className="ebs-break"

            onClick={() => {
              employeebreak().catch(notifyError);
            }}
            disabled={disablebreak}
          >
            {show ? "Break" : "Resume"}
          </Button>
        </div>
        <div className="child">
          <Button
            className="checkoutBtn"
            onClick={() => {
              showModal();
            }}
            disabled={disableCheckout}
          >
            Check out
          </Button>
        </div>
      </div>
      <br />
    </>
  );
};

export default Clock;
