const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Assigedproject = require('../model/assignedprojects');
const checkAuth = require('../middleware/check-auth');


/**
 * @swagger
 * components:
 *     schema:
 *         assignedprojects:
 *                type: object
 *                properties:
 *                    employeename:
 *                        type: string
 *                    emp_id:
 *                        type: string
 *                    assignedprojectname:
 *                        type: string
 *                    assignedprojectdescription:
 *                        type: string
 *                    assignedprojecttechnologies:
 *                        type: string
 *                    assignedprojectstart:
 *                        type: string
 *                    assignedprojectend:
 *                        type: string
 *                    assignedprojectstatus:
 *                        type: string
 *                    project_id:
 *                        type: string
 */




//=============================================== add new project ====================================================
/**
 * @swagger
 * /assignproject:
 *  post:
 *      summary:  Assign new project
 *      description: Assign new project
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/assignedprojects'
 *      responses:
 *          200:
 *              description: Success! new project assigned
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/assignedprojects'
 */
//POST PROJECT
router.post('/', (req, res, next) => {
    const assignedproject = new Assigedproject({
        _id: new mongoose.Types.ObjectId,
        employeename: req.body.employeename,
        emp_id: req.body.emp_id,
        project_id: req.body.project_id,
        assignedprojectname: req.body.assignedprojectname,
        assignedprojectdescription: req.body.assignedprojectdescription,
        assignedprojecttechnologies: req.body.assignedprojecttechnologies,
        assignedprojectstart: req.body.assignedprojectstart,
        assignedprojectend: req.body.assignedprojectend,
        assignedprojectstatus: req.body.assignedprojectstatus,

    })
    assignedproject.save()
        .then(result => {
            console.log(result);
            res.status(200).json({
                newProjectAssigned: result
            })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
});
//=============================================== add new project ====================================================

//============================================== get single project by ID =========================================
/**
 * @swagger
 * /assignproject/singleproject/{_id}:
 *  get:
 *      summary: Get particular assigned project by projectID
 *      description: Get particular assigned project by projectID
 *      parameters:
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  assigned projectID required
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: Success! Get project
 */
// get single employee project by id
router.get("/singleproject/:_id", (req, res, next) => {
    console.log({ _id: req.params._id });
    Assigedproject.find({ _id: req.params._id })
        .then((result) => {
            res.status(200).json({
                singleAssignedProject: result,
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});
//============================================== get single project by ID =========================================


router.get("/assigned/:project_id", (req, res, next) => {
    console.log({ project_id: req.params.project_id });
    Assigedproject.find({ project_id: req.params.project_id})
        .then((result) => {
            res.status(200).json({
                getAssignedProject: result,
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});



//=============================================== get all projects ====================================================
/**
 * @swagger
 * /assignproject:
 *  get:
 *      summary: Get all assigned projects
 *      description: Get all assigned projects
 *      responses:
 *          200:
 *              description: Success! Get all assigned projects
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/assignedprojects'
 */
// get all projects
router.get("/", (req, res, next) => {
    Assigedproject.find()
        .then((result) => {
            res.status(200).json({
                assignedprojectData: result,
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});
//=============================================== get all projects ====================================================



//=============================================== get all projects of particular employee ====================================================
/**
 * @swagger
 * /assignproject/allassignedprojects/{emp_id}:
 *  get:
 *      summary: Get particular project by employeeID
 *      description: Get particular project by employeeID
 *      parameters:
 *          - in: path
 *            name: emp_id
 *            required: true
 *            description:  employeeID required
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: Success! Get project
 */
// get employee's all projects by employeeID 
router.get("/allassignedprojects/:emp_id", (req, res, next) => {
    console.log({ emp_id: req.params.emp_id });
    Assigedproject.find({ emp_id: req.params.emp_id })
        .then((result) => {
            res.status(200).json({
                singleEmployeeAllProjects: result,
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});
//=============================================== get all projects of particular employee ====================================================




//=============================================== delete project ====================================================
/**
 * @swagger
 * /assignproject/assignedprojectdelete/{_id}:
 *  delete:
 *      summary: Delete particular user by projectID
 *      description: Delete particular user by projectID
 *      parameters:
 *          - in: path
 *            name: _id
 *            required: true
 *            description: assigned projectID required
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: Success! assigned project deleted
 */
// delete project
router.delete("/assignedprojectdelete/:_id", (req, res, next) => {
    Assigedproject.remove({ _id: req.params._id })
        .then((result) => {
            res.status(200).json({
                message: "Project Deleted",
                result: result,
            });
        })
        .catch((err) => {
            res.status(500).json({
                error: err,
            });
        });
});
//=============================================== delete project ====================================================


//================================================= update project details===============================
/**
 * @swagger
 * /assignproject/{_id}:
 *  put:
 *      summary: Update assigned project
 *      description: Update assigned project
 *      parameters:
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  assigned projectID required
 *            schema:
 *              type: string
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/assignedprojects'
 *      responses:
 *          200:
 *              description: Success! assigned project Updated
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/assignedprojects'
 */
// update project details
router.put("/:_id", (req, res, next) => {
    console.log(req.params._id);
    // console.log(req.body.name, "name");
    Assigedproject.findOneAndUpdate(
        { _id: req.params._id },
        {
            $set: {
                employeename: req.body.employeename,
                emp_id: req.body.emp_id,
                project_id: req.body.project_id,
                assignedprojectname: req.body.assignedprojectname,
                assignedprojectdescription: req.body.assignedprojectdescription,
                assignedprojecttechnologies: req.body.assignedprojecttechnologies,
                assignedprojectstart: req.body.assignedprojectstart,
                assignedprojectend: req.body.assignedprojectend,
                assignedprojectstatus: req.body.assignedprojectstatus,

            },
        }
    )
        .then((result) => {
            res.status(200).json({
                updated_project: result,
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});
//================================================= update project details===============================


module.exports = router;
