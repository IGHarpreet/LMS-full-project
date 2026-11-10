import React from "react";
import AdminProject from "./AdminProject";
import EmployeeProject from "./EmployeeProject";
import { getUser } from "../utils/auth";

const Projects = () => {
  const user = getUser() || {};
  return user.role === "admin" || user.role === "hr" ? <AdminProject /> : <EmployeeProject />;
};

export default Projects;
