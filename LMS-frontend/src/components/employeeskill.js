import React, { useState, useEffect } from "react";
import { Space, Table, Tag, Select, Button, message } from "antd";
import jwt_decode from '../utils/jwtSafe';
import axios from "axios";
import { Form, Input, Rate, Modal } from "antd";
import { StarOutlined } from "@mui/icons-material";

const EmployeeSkill = () => {
  const { Option } = Select;
  const [skillname, setSkillName] = useState("");
  // console.log("user skill data ", skillname);
  const [skillExperience, setSkillExperience] = useState("");

  const [skillrating, setSkillRating] = useState("");

  const [skilldata, setSkillData] = useState("");
  // console.log("Skill Data", skilldata);
  const [form] = Form.useForm();
  const desc = ["terrible", "bad", "normal", "good", "wonderful"];

  const [addskill, setAddSkill] = useState("");
  // console.log("new add Skills", addskill);

  const DataSkill = async (value) => {
    const token = localStorage.getItem("access_token1");
    var decoded = jwt_decode(token);
    const emp_id = decoded._id;
    // console.warn("emp_id", emp_id);
    if (skillname === "" || skillExperience === "" || skillrating === "") {
      message.error("select all fields");
    } else {
      await axios
        .post(`${process.env.REACT_APP_BASE_URL}/skill`, {
          emp_id,
          skillname,
          skillExperience,
          skillrating,
        })
        .then((res) => {
          // console.log("post data", res);
          message.success("SuccessFully Submit !!");
        });
    }
    window.location.reload();
  };

  useEffect(() => {
    GetSkillList();
  }, []);

  const handleempskill = (value) => {
    // value={
    //   isvalue?.skillname
    // }
    setSkillName(value);
  
    // console.log("skill set", value);
  };

  const handleRating = (e) => {
    setSkillRating(e.target.value);
  };

  const handleExperience = (value) => {
    setSkillExperience(value);
  };
  const handleSubmit = () => {
    DataSkill();
  };

  const GetSkillList = async () => {
    await axios
      .get(`${process.env.REACT_APP_BASE_URL}/handleskill/newListSkill`)
      .then((res) => {
        setAddSkill(res?.data?.skillListData);
        // console.log("get data list", res?.data?.skillListData);
      });
  };

  const options = [];
  for (let i = 0; i < addskill.length; i++) {
    options.push({
      label: addskill[i].skillList,
      value: addskill[i].skillList,
    });
  }

  const columns = [
    {
      title: "Skills",
      key: "skills",
      dataIndex: "skillname",
    },
    {
      title: "Experience",
      dataIndex: "skillExperience",
      key: "experience",
      // render: (text) => <a>{text}</a>,
    },

    {
      title: "Rating",
      key: "rating",
      render: (record) => {
        return (
          // dataIndex: "skillrating",
          <>
            <span>
              <Rate value={record?.skillrating} />
            </span>
          </>
        );
      },
    },
  ];

  useEffect(() => {
    userskillData();
  }, []);

  const userskillData = async () => {
    const token = localStorage.getItem("access_token1");
    var decoded = jwt_decode(token);

    await axios
      .get(`${process.env.REACT_APP_BASE_URL}/skill/emp/${decoded._id}`)
      .then((res) => {
        // console.log("fhdfhdsjgfh", res);
        setSkillData(res?.data?.SingleEmpAllData);
        // console.log(res?.data?.SingleEmpAllData);
      });
  };

  const onFinish = (values) => {
    // console.log(values);
  };

  const onReset = () => {
    form.resetFields();
  };

  const layout = {
    labelCol: {
      span: 8,
    },
    wrapperCol: {
      span: 16,
    },
  };
  const tailLayout = {
    wrapperCol: {
      offset: 8,
      span: 16,
    },
  };

  return (
    <div className="skillsManagement">
      <div style={{ display: "flex" }}>
        <h1>DATE :</h1>

        <div style={{ marginLeft: "5px" }}>
          {new Date().toLocaleDateString()}
        </div>

        <h1 style={{ marginLeft: "15px" }}>TIME :</h1>
        <div style={{ marginLeft: "5px" }}>
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      <h3>Add Your Skills</h3>
      <br />

      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item>
          <Select
            name="skillname"
            style={{
              width: "50%",
              marginTop: "40px",
            }}
            placeholder="select your skills"
            optionLabelProp="label"
            options={options}
            onChange={handleempskill}
           
          ></Select>
        </Form.Item>
        <Form.Item
          name="skillExperience"
          style={{
            width: "100%",
          }}
        >
          <Select
            style={{
              width: "50%",
            }}
            placeholder="Your's Experience"
            onChange={handleExperience}
            optionLabelProp="label"
          >
            <Option value="6 Months" label="6 months">
              <div className="demo-option-label-item">6 Months</div>
            </Option>
            <Option value="1 Year" label="1 year">
              <div className="demo-option-label-item">1 Year</div>
            </Option>
            <Option value="2 Years" label="2 year">
              <div className="demo-option-label-item">2 Years</div>
            </Option>
            <Option value="3 Years" label="3 year">
              <div className="demo-option-label-item">3 Years</div>
            </Option>
            <Option value="4 Years" label="4 years">
              <div className="demo-option-label-item">4 Years</div>
            </Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <span>
            <Rate
              allowClear={false}
              tooltips={desc}
              onChange={setSkillRating}
              value={skillrating}
            />
            {skillrating ? (
              <span className="ant-rate-text">{desc[skillrating - 1]}</span>
            ) : (
              ""
            )}
          </span>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" onClick={handleSubmit}>
            Submit
          </Button>
          <Button
            style={{ marginLeft: "5px" }}
            htmlType="button"
            onClick={onReset}
          >
            Reset
          </Button>
        </Form.Item>
      </Form>

      <br />
      <div>
        <Table columns={columns} dataSource={skilldata} pagination={false} />
      </div>
    </div>
  );
};
export default EmployeeSkill;
