import { makeStyles } from "@material-ui/core";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect } from "react";

const useStyles = makeStyles({
  addEmpColor: {
    backgroundColor: "#87CEFA",
    textAlign: "center",
    marginBottom: "5px",
    color: "#000000",
    marginTop: "30px",
    fontWeight: "bold",
    marginTop: "80px",
  },
});

const Edit = () => {
  const [name, setName] = React.useState(" ");
  const [email, setEmail] = React.useState(" ");
  const [phone, setPhone] = React.useState(" ");
  const [gender, setGender] = React.useState(" ");
  const { _id } = useParams();
  const classes = useStyles();
  const navigate = useNavigate();

  useEffect(() => {
    getEmployeeDetails();
  }, []);

  const getEmployeeDetails = async () => {
    let employ = await fetch(
      `${process.env.REACT_APP_BASE_URL}/employee/${_id}`
    );
    employ = await employ.json();
    // console.warn(employ);

    setName(employ.name);
    setEmail(employ.email);
    setPhone(employ.phone);
    setGender(employ.gender);
  };

  function updateEmployee() {
    let item = { name, email, phone, gender };
    // console.warn("item", item);
    fetch(`${process.env.REACT_APP_BASE_URL}/employee/${_id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    }).then((result) => {
      result.json().then((resp) => {
        // console.warn(resp);
      });
    });
  }

  function handleClick() {
    navigate("/dashboard");
  }

  return <></>;
};

export default Edit;
