import {
  Typography,
  Box,
  makeStyles,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@material-ui/core";
import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
const useStyles = makeStyles({
  headingColor: {
    backgroundColor: "#87CEFA",
    color: "#000000",
    marginBottom: "20px",
    marginTop: "40px",
    textAlign: "center",
    fontWeight: "bold",
  },
  tableHeadCell: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
});

const View = () => {
  const navigate = useNavigate();
  const classes = useStyles();
  const { _id } = useParams();
  // console.log(_id)
  const [employ, setEmploy] = useState([]);
  useEffect(() => {
    async function getOneEmploy() {
      try {
        const employ = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/employee/${_id}`
        );
        // console.log(employ.data);
        setEmploy(employ.data);
        // console.log(employ._id);
      } catch (error) {
        // console.log("Something went Wrong");
      }
    }

    getOneEmploy();
  }, [_id]);
  return (
    <>
      <Box textAlign="center" p={2} className={classes.headingColor}>
        <Typography variant="h3">Employee Detail</Typography>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: "lightgray" }}>
              <TableCell align="center" className={classes.tableHeadCell}>
                Id
              </TableCell>
              <TableCell align="center" className={classes.tableHeadCell}>
                Name
              </TableCell>
              <TableCell align="center" className={classes.tableHeadCell}>
                Email
              </TableCell>
              <TableCell align="center" className={classes.tableHeadCell}>
                Phone
              </TableCell>
              <TableCell align="center" className={classes.tableHeadCell}>
                Gender
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center">{employ._id}</TableCell>
              <TableCell align="center">{employ.name}</TableCell>
              <TableCell align="center">{employ.email}</TableCell>
              <TableCell align="center">{employ.phone}</TableCell>
              <TableCell align="center">{employ.gender}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box m={3} textAlign="center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/employees")}
        >
          Back to Home
        </Button>
      </Box>
    </>
  );
};

export default View;
