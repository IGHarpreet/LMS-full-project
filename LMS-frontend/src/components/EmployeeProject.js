import React, { useEffect, useState } from 'react'
import { Button } from 'antd';
import {
    PlusOutlined,

} from "@ant-design/icons";
import { Select, Table, Typography } from "antd";
import jwt_decode from '../utils/jwtSafe';
import axios from "axios";
import { FcHighPriority, FcApproval, FcCancel, FcInfo } from "react-icons/fc";
const { Option } = Select;
const { Text } = Typography


const Employeeproject = () => {
    const [myprojectlist, setmyprojectlist] = useState([]);

    useEffect(() => {
        const getmyProjects = async () => {
            const token = localStorage.getItem("access_token1");
            var decoded = jwt_decode(token);
            await axios
                .get(`${process.env.REACT_APP_BASE_URL}/project/assignedtoyou/${decoded._id}`)
                .then((res) => {
                    // console.warn("res", res?.data?.yourprojects[0])
                    setmyprojectlist(res?.data?.yourprojects)
                    // console.warn("mydataSource", mydataSource)
                });
        };
        getmyProjects()
    }, [])




    const columns = [
        {
            title: <div className='handletableheadforEmptable'><Text className='tablerowtextemployeetable'>Project name</Text></div>,
            dataIndex: "projectname",
            render: (text, record, index) =>
            <Text className='tablerowtext'>{text}</Text>
            // width: "160px",
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
            dataIndex: "assignedprojectstatus",
            render: (text, record, index) =>
            <Text className='tablerowtext'>{text}</Text>
        }
    ];


    return (


        <div>

            <Table columns={columns} dataSource={myprojectlist} />
        </div>


    )

}
export default Employeeproject;