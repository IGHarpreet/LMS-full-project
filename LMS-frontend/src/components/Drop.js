import React, { useEffect, useState } from "react";
import { Avatar, Dropdown, message } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  PoweroffOutlined,
  DownOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import darkVars from "./dark.json";
import lightVars from "./light.json";
import { getUser, logout } from "../utils/auth";

const applyTheme = (mode) => {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    window.less?.modifyVars(mode === "dark" ? darkVars : lightVars);
  } catch (e) {
    /* less.js is optional (loaded from CDN) */
  }
};

const Drop = () => {
  const navigate = useNavigate();
  const user = getUser() || {};
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    if (!user._id) return undefined;
    let cancelled = false;
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/user/${user._id}`)
      .then((res) => {
        const pic = res?.data?.myData?.profilepicture;
        if (!cancelled && pic) setPhoto(`${process.env.REACT_APP_BASE_URL}/images/${pic}`);
      })
      .catch(() => {
        /* avatar falls back to initials */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id]);

  const setMode = (mode) => {
    applyTheme(mode);
    if (mode === "dark") {
      localStorage.setItem("DARK_MODE", darkVars["@theme"]);
      localStorage.removeItem("LIGHT_MODE");
      message.success("Dark theme applied");
    } else {
      localStorage.setItem("LIGHT_MODE", lightVars["@mode"]);
      localStorage.removeItem("DARK_MODE");
      message.success("Light theme applied");
    }
  };

  const items = [
    { key: "profile", icon: <UserOutlined />, label: "My profile" },
    { key: "password", icon: <SettingOutlined />, label: "Change password" },
    {
      key: "theme",
      icon: <BulbOutlined />,
      label: "Theme",
      children: [
        { key: "light", label: "Light" },
        { key: "dark", label: "Dark" },
      ],
    },
    { type: "divider" },
    { key: "logout", icon: <PoweroffOutlined />, label: "Sign out", danger: true },
  ];

  const onClick = ({ key }) => {
    if (key === "profile") navigate("/profileemployee");
    else if (key === "password") navigate("/changepassword");
    else if (key === "light" || key === "dark") setMode(key);
    else if (key === "logout") logout();
  };

  const initial = (user.name || "?").charAt(0).toUpperCase();

  return (
    <Dropdown menu={{ items, onClick }} trigger={["click"]} placement="bottomRight">
      <div className="ebs-user" role="button" tabIndex={0}>
        <Avatar src={photo || undefined} style={{ background: "var(--ebs-brand)" }}>
          {initial}
        </Avatar>
        <div className="ebs-user-meta">
          <span className="ebs-user-name">{user.name || "User"}</span>
          <span className="ebs-user-role">{user.role || ""}</span>
        </div>
        <DownOutlined style={{ fontSize: 10, color: "var(--ebs-muted)" }} />
      </div>
    </Dropdown>
  );
};

export { applyTheme };
export default Drop;
