import React from "react";
import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { getUser } from "../utils/auth";

const { Sider } = Layout;

const adminItems = [
  {
    key: "/dashboard",
    icon: <AppstoreOutlined />,
    label: "Dashboard",
  },
  {
    key: "/attendance",
    icon: <ClockCircleOutlined />,
    label: "Attendance",
  },
  {
    key: "/employees",
    icon: <TeamOutlined />,
    label: "Employees",
  },
  {
    key: "/leave",
    icon: <CalendarOutlined />,
    label: "Leave",
  },
  {
    key: "/announcements",
    icon: <NotificationOutlined />,
    label: "News & Events",
  },
  // { key: "/adminhandleskill", icon: <TrophyOutlined />, label: "Skills" },
  // { key: "/projects", icon: <FolderOpenOutlined />, label: "Projects" },
];

const employeeItems = [
  {
    key: "/dashboard",
    icon: <AppstoreOutlined />,
    label: "Dashboard",
  },
  {
    key: "/attendance",
    icon: <ClockCircleOutlined />,
    label: "Attendance",
  },
  {
    key: "/leave",
    icon: <CalendarOutlined />,
    label: "Leave",
  },
  {
    key: "/announcements",
    icon: <NotificationOutlined />,
    label: "News & Events",
  },
  // { key: "/employeeskill", icon: <TrophyOutlined />, label: "Skills" },
  // { key: "/projects", icon: <FolderOpenOutlined />, label: "Projects" },
];

const Sidebar = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = getUser();

  const isManager = user?.role === "admin" || user?.role === "hr";
  const items = isManager ? adminItems : employeeItems;

  const selected =
    items.find(
      (i) => pathname === i.key || pathname.startsWith(`${i.key}/`)
    )?.key || (pathname === "/" ? "/dashboard" : undefined);

  return (
    <Sider
      className="ebs-sider"
      width={236}
      collapsedWidth={window.innerWidth < 576 ? 0 : 72}
      breakpoint="lg"
      collapsible
      trigger={null}
      collapsed={collapsed}
      onBreakpoint={(broken) => onCollapse(broken)}
    >
      <Menu
        mode="inline"
        theme="dark"
        items={items}
        selectedKeys={selected ? [selected] : []}
        onClick={({ key }) => {
          navigate(key);

          if (window.innerWidth < 992) {
            onCollapse(true);
          }
        }}
      />
    </Sider>
  );
};

export default Sidebar;
