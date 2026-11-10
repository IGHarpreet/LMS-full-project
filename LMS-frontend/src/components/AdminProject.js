import React, { useEffect, useState } from 'react'
import {
    PlusOutlined,

} from "@ant-design/icons";
import { Button, Card, Col, Form, Input, message, Modal, Space, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import jwt_decode from '../utils/jwtSafe';
import axios from "axios";
import { DatePicker } from 'antd';
import { Avatar, Badge } from "antd";
import { SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Select, Table } from "antd";
import { FcHighPriority, FcApproval, FcCancel, FcInfo } from "react-icons/fc";
const { Option } = Select;
const { Column, ColumnGroup } = Table;
const { TextArea } = Input;
const { Text } = Typography;

const Adminproject = () => {
    const [form] = Form.useForm();
    const [isopenmodal, setIsOpenModal] = useState(false);
    const [myopenmodal, setmyOpenModal] = useState(false);

    const [projectname, setProjectname] = useState("");
    const [youremployeeID, setyouremployeeID] = useState("");
    const [projectdescription, setProjectdescription] = useState("");
    const [projecttechnologies, setProjecttechnologies] = useState("");
    const [projectstart, setProjectstart] = useState("");
    const [projectend, setProjectend] = useState("");
    const [dataSource, setDataSource] = useState([]);
    const [edituserlist, setedituserlist] = useState([]);

    const [mydataSource, setmyDataSource] = useState([]);
    const [selectedemployees, setselectedemployees] = useState([]);

    const [value, setValue] = useState([selectedemployees]);


    // console.log("newValue", selectedemployees)
    const [skillisting, setskillisting] = useState([]);

    // const [employeename, setEmployeename] = useState("")
    // const [assignedprojectname, setAssignedprojectname] = useState("")
    // const [assignedprojectdescription, setAssignedprojectdescription] = useState("")
    // const [assignedprojecttechnologies, setAssignedprojecttechnologies] = useState("")
    // const [assignedprojectstart, setAssignedprojectstart] = useState("")
    // const [assignedprojectend, setAssignedprojectend] = useState("")
    // const [assignedprojectstatus, setAssignedprojectstatus] = useState("")
    const [assignedemployeeslist, setassignedEmployees] = useState([])
    const [myrecord, setmyrecord] = useState([])
    const [newusers, setnewusers] = useState([])

    // console.warn("myrecord 2", myrecord)

    // console.warn("assignedemployees", assignedemployeeslist.length)

    // console.log("skillisting",skillisting)



    useEffect(() => {
        const getAllProjects = async () => {

            await axios
                .get(`${process.env.REACT_APP_BASE_URL}/project`)
                .then((res) => {
                    setDataSource(res?.data?.projectData)


                });
        };
        getAllProjects()
    }, [])



    useEffect(() => {
        const getAllskills = async () => {

            await axios
                .get(`${process.env.REACT_APP_BASE_URL}/handleskill/istechno`)
                .then((res) => {
                    setskillisting(res?.data?.skilltechnology)

                    // console.log("res", res)
                });
        };
        getAllskills()
    }, [])

    const technologyoptions = [];
    for (let i = 0; i < skillisting.length; i++) {
        technologyoptions.push({
            label: skillisting[i].skillList,
            value: skillisting[i].skillList,


        });

        // console.log("technologyoptions", technologyoptions)
    }


    useEffect(() => {
        const getAllUsers = async () => {
            await axios
                .get(`${process.env.REACT_APP_BASE_URL}/user/foremployeerole`)
                .then((res) => {
                    setmyDataSource(res?.data?.employeeData)
                    // console.log("user", res?.data?.userData);

                });
        }
        getAllUsers()
    }, [])



    const onFinish = () => {
        message.success("New project added successfully!");
        setIsOpenModal(false);

    };


    const handletechnology = (value) => {
        // console.log(`selected ${value}`);
        setProjecttechnologies(value);
    }

    const handlestartdate = (value) => {
        setProjectstart(value.format("YYYY-MM-DD"));
        // console.warn("start", value)

    }

    const handleenddate = (value) => {
        setProjectend(value.format("YYYY-MM-DD"));
        // console.warn("end", value)

    }


    const onFinishFailed = (errorInfo) => {
        // console.log("Failed:", errorInfo);
    };

    const showModal = () => {
        setIsOpenModal(true);
    };

    const handleOk = async () => {
        try {
            await axios
                .post(`${process.env.REACT_APP_BASE_URL}/project`, {
                    projectname,
                    projectdescription,
                    projecttechnologies,
                    projectstart,
                    projectend
                })
                .then((res) => {
                    if(res){
                        window.location.reload()
                    }
                    // console.log("project", res);

                });
        } catch (error) {

            if (projectname === "" && projectdescription === "" && projecttechnologies === "" && projectstart === "" && projectend === "") {
                message.error("Please fill required fields!");
            } else {
                message.error("Submission failed!");
            }
        }
        // setIsOpenModal(false);
    };

    const handleCancel = () => {
        setIsOpenModal(false);
    };



    const onmyFinishFailed = (errorInfo) => {
        // console.log("Failed:", errorInfo);
    };


    const myshowmodal = async (record) => {
        // console.warn("record", record)
        setmyrecord({ ...record })
        // console.warn("myrecord 1", record)
        const arr = []
        if (record?.employees?.length === 0) {
            message.warning("Not assigned yet");
            // console.warn("not assigned yet")
        } else if (record?.employees?.length !== 0) {
            for (let m = 0; m < record?.employees?.length; m++) {

                arr.push({
                    label: record?.employees[m].name,
                    value: record?.employees[m].emp_id
                })
            }

            // console.warn("assigned")
        }
        setValue(arr)
        setmyOpenModal(true);

    };


    const myhandleOk = async () => {
        const employees = myrecord?.employees
        const newassignedemployees = []
        // console.log("employees here 1", employees)

        // console.log("value", value)
        if (value.length === 0) {
            // console.error("removed all ");
            // Remove elements from array
            employees.pop();
            await axios.put(`${process.env.REACT_APP_BASE_URL}/project/${myrecord._id}`, {
                employees
            })
                .then((res) => {
                    // console.log("user assigned", res);
                    message.success("All employees removed!");
                });


        } else if (value.length !== 0) {
            message.warning("Please wait...");
            // Remove elements from array
            employees.pop();
            // console.log("employees here 2", employees)

            // console.warn("remaining");
            // console.log("value here", value)

            for (let g = 0; g < value.length; g++) {

                // console.log("value here 1", value)

                await axios.get(`${process.env.REACT_APP_BASE_URL}/user/${value[g]}`, {
                })
                    .then((res) => {
                        // console.log("res", res?.data?.myData);

                        // console.log("value here 2", value[g])

                        // console.log("user ID", res?.data?.myData?._id);
                        if (value[g] !== res?.data?.myData?._id) {
                            // console.log("value here 3", res?.data?.myData?._id)
                            // console.warn("ID not matching");

                        } else if (value[g] === res?.data?.myData?._id) {
                            // console.warn("matching", value[g], res?.data?.myData?._id);

                            newassignedemployees.push({
                                emp_id: res?.data?.myData?._id,
                                name: res?.data?.myData?.name,
                                gender: res?.data?.myData?.gender,
                                password: res?.data?.myData?.password,
                                role: res?.data?.myData?.role,
                                email: res?.data?.myData?.email,
                                contact: res?.data?.myData?.contact
                            })
                        }
                    });

            }

            axios.put(`${process.env.REACT_APP_BASE_URL}/project/${myrecord._id}`, {
                employees: newassignedemployees
            })
                .then((res) => {
                    // console.warn("user assigned", res);
                    message.success("Project assigned successfully!");
                });
        }
        setmyOpenModal(false);
        //  window.location.reload()
    };






    const myhandleCancelbutton = () => {
        message.error("Failed to assign");
        setmyOpenModal(false);
    };


    const myhandleCancel = () => {
        setmyOpenModal(false);
    };



    const columns = [
        {
            title: <div className='handletableheadforEmptable'><Text className='tablerowtextemployeetable'>Project name</Text></div>,

            dataIndex: "projectname",
            // width: "150px",
            render: (text, record, index) =>
                <Text className='tablerowtext'>{text}</Text>
        },
        {
            title: <div className='handletableheadforEmptable'><Text className='tablerowtextemployeetable'>Description</Text></div>,

            dataIndex: "projectdescription",
            render: (text, record, index) =>
                <Text className='tablerowtext'>{text}</Text>
        },
        {
            title: <div className='handletableheadforEmptable'><Text className='tablerowtextemployeetable'>Technology</Text></div>,

            dataIndex: "projecttechnologies",
            render: (text, record, index) =>
                <Text className='tablerowtext'>{text}</Text>
        },
        {
            title: <div className='handletableheadforEmptable'><Text className='tablerowtextemployeetable'>Start</Text></div>,

            dataIndex: "projectstart",
            render: (text, record, index) =>
                <Text className='tablerowtext'>{text}</Text>
        },
        {
            title: <div className='handletableheadforEmptable'><Text className='tablerowtextemployeetable'>End</Text></div>,

            dataIndex: "projectend",
            render: (text, record, index) =>
                <Text className='tablerowtext'>{text}</Text>
        },
        {

            title: <div className='handletableheadforEmptable'><Text className='tablerowtextemployeetable'>Status</Text></div>,

            render: (record) => {
                return (
                    <>
                        <Button
                            className='assignBtn'
                            onClick={() => { myshowmodal(record) }}

                        >
                           <Text className='tablerowtextemployeetable'> Assign</Text>
                        </Button>
                    </>
                )
            }
        },

    ];
    const options = [];
    for (let i = 0; i < mydataSource.length; i++) {
        options.push({
            label: mydataSource[i].name,
            value: mydataSource[i]._id,


        });

        // console.log("options", options)
    }

    // console.log("selectedemployees", selectedemployees)

    const selectProps = {
        mode: 'multiple',
        style: {
            width: '100%',
        },
        // selectedemployees,
        options,
        value,
        onChange: (newValue) => {
            setValue(newValue);
        },
        placeholder: 'Select Item...',
        maxTagCount: 'responsive',
    };
    // console.warn("selectProps", selectProps)



    return (
        <>
            <Modal
                title="Add New Project"
                cancelButtonProps={{ style: { display: "none" } }}
                okButtonProps={{ style: { display: "none" } }}
                open={isopenmodal}
                onCancel={handleCancel}
                width={600}
            >
                <Form
                    name="basic"
                    labelCol={{
                        span: 8,
                    }}
                    wrapperCol={{
                        span: 16,
                    }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <Form.Item
                        // style={{ fontWeight: "bold",}}
                        label="Project name"
                        name="projectname"
                        rules={[
                            {
                                required: true,
                                message: "Please enter project name.",
                            },
                        ]}
                    >
                        <Input
                            onChange={(e) => {
                                setProjectname(e.target.value);
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        // style={{ fontWeight: "bold" }}
                        label="Project description"
                        name="projectdescription"
                        rules={[
                            {
                                required: true,
                                message: "Please enter project description.",
                            },
                        ]}
                    >
                        <TextArea rows={4} onChange={(e) => {
                            setProjectdescription(e.target.value);
                        }} />

                    </Form.Item>
                    <Form.Item
                        // style={{ fontWeight: "bold" }}
                        label="Technology"
                        name="projecttechnologies"
                        rules={[
                            {
                                required: true,
                                message: "Please enter project technology.",
                            },
                        ]}
                    >
                        <Select
                            mode="multiple"
                            allowClear
                            style={{
                                width: '100%',
                            }}
                            placeholder="Please select"
                            onChange={handletechnology}
                            options={technologyoptions}
                        />

                    </Form.Item>
                    <Form.Item
                        // style={{ fontWeight: "bold" }}
                        label="Start"
                        name="projectstart"
                        rules={[
                            {
                                required: true,
                                message: "Please enter project start date.",
                            },
                        ]}
                    >
                        <DatePicker onChange={handlestartdate} />

                    </Form.Item>
                    <Form.Item
                        // style={{ fontWeight: "bold" }}
                        label="End"
                        name="projectend"
                        rules={[
                            {
                                required: true,
                                message: "Please enter project end date.",
                            },
                        ]}
                    >
                        <DatePicker onChange={handleenddate} />

                    </Form.Item>

                    <Form.Item>
                        <div className='mainprojectbtn' >
                            <Button
                                className='projectbtn'
                           
                                htmlType="cancel"
                                onClick={handleCancel}
                            // type="primary"
                            >
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="Done" onClick={handleOk}>
                                Add Project
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            <div>
                <Button className='calendarbtn' onClick={showModal}><PlusOutlined />Add new project</Button>
                <br />
                <Table rowKey="_id" columns={columns} dataSource={dataSource} />
            </div>


            <Modal
                title="Select Employee"
                cancelButtonProps={{ style: { display: "none" } }}
                okButtonProps={{ style: { display: "none" } }}
                open={myopenmodal}
                onCancel={myhandleCancel}
                width={900}

            >
                <Form
                    name="basic"
                    labelCol={{
                        span: 8,
                    }}
                    wrapperCol={{
                        span: 16,
                    }}
                    autoComplete="off"

                >

                    <Form.Item style={{ marginBottom: "300px" }}  >
                        <Space
                            direction="vertical"
                            style={{
                                width: '100%',
                            }}
                        >
                            <Select {...selectProps} />

                        </Space>
                    </Form.Item>
                    <Form.Item style={{ float: "right", marginLeft: "10px" }}>

                        <Button
                            style={{
                                marginRight: "4px",
                                backgroundColor: "#d22d2d",
                                // borderColor: "blanchedalmond",
                            }}
                            type="primary"
                            htmlType="cancel"
                            onClick={myhandleCancelbutton}
                        >
                            Cancel
                        </Button>
                    </Form.Item>
                    <Form.Item style={{ float: "right" }}>

                        <Button type="primary" htmlType="Done" onClick={() => { myhandleOk() }} >
                            Add employees
                        </Button>

                    </Form.Item>
                </Form>

            </Modal>
        </>


    )

}
export default Adminproject;