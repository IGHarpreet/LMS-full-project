const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../model/project');
const checkAuth = require('../middleware/check-auth');


/**
 * @swagger
 * components:
 *     schema:
 *         project:
 *                type: object
 *                properties:
 *                    employeename:
 *                        type: string
 *                    emp_id:
 *                        type: string
 *                    projectname:
 *                        type: string
 *                    projectdescription:
 *                        type: string
 *                    projecttechnologies:
 *                        type: string
 *                    projectstart:
 *                        type: string
 *                    projectend:
 *                        type: string
 */




//=============================================== add new project ====================================================
/**
 * @swagger
 * /project:
 *  post:
 *      summary: Add new project
 *      description: Add new project
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/project'
 *      responses:
 *          200:
 *              description: Success! new project added
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/project'
 */
//POST PROJECT
router.post('/', (req, res, next) => {
    const project = new Project({
        _id: new mongoose.Types.ObjectId,
        employeename: req.body.employeename,
        // emp_id: req.body.emp_id,
        projectname: req.body.projectname,
        projectdescription: req.body.projectdescription,
        projecttechnologies: req.body.projecttechnologies,
        projectstart: req.body.projectstart,
        projectend: req.body.projectend,
        employees: req.body.employees,


    })
    project.save()
        .then(result => {
            console.log(result);
            res.status(200).json({
                newProject: result
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
 * /project/singlepro/{_id}:
 *  get:
 *      summary: Get particular project by projectID
 *      description: Get particular project by projectID
 *      parameters:
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  projectID required
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: Success! Get project
 */
// get single employee project by id
router.get("/singlepro/:_id", (req, res, next) => {
    console.log({ _id: req.params._id });
    Project.find({ _id: req.params._id })
        .then((result) => {
            res.status(200).json({
                singleProject: result,
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



//=============================================== get all projects ====================================================
/**
 * @swagger
 * /project:
 *  get:
 *      summary: Get all projects
 *      description: Get all projects
 *      responses:
 *          200:
 *              description: Success! Get all projects
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/project'
 */
// get all projects
router.get("/", (req, res, next) => {
    Project.find()
        .then((result) => {
            res.status(200).json({
                projectData: result,
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
 * /project/employeeallprojects/{emp_id}:
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
router.get("/employeeallprojects/:emp_id", (req, res, next) => {
    console.log({ emp_id: req.params.emp_id });
    Project.find({ emp_id: req.params.emp_id })
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
 * /project/projectdelete/{_id}:
 *  delete:
 *      summary: Delete particular user by projectID
 *      description: Delete particular user by projectID
 *      parameters:
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  projectID required
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: Success! project deleted
 */
// delete project
router.delete("/projectdelete/:_id", (req, res, next) => {
    Project.remove({ _id: req.params._id })
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
//remove employee from project
router.get("/assignedtoyou/:emp_id", (req, res, next) => {
    var query = {
        employees: {
            $elemMatch: {
                emp_id: req.params.emp_id
            }
        }
    }
    Project.findOne({ "employees.emp_id": req.params.emp_id }, (query))
        .then((result) => {
            res.status(200).json({
                yourprojects: result,
            });
        })
        .catch((err) => {
            res.status(500).json({
                error: err,
            });
        });
});
//================================================= update project details===============================
/**
 * @swagger
 * /project/{_id}:
 *  put:
 *      summary: Update project
 *      description: Update project
 *      parameters:
 *          - in: path
 *            name: _id
 *            required: true
 *            description:  projectID required
 *            schema:
 *              type: string
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/project'
 *      responses:
 *          200:
 *              description: Success! project Updated
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schema/project'
 */
// update project details
router.put("/:_id", (req, res, next) => {
    console.log(req.params._id);
    // console.log(req.body.name, "name");
    Project.findOneAndUpdate(
        { _id: req.params._id },
        {
            $set: {
                projectname: req.body.projectname,
                projectdescription: req.body.projectdescription,
                projecttechnologies: req.body.projecttechnologies,
                projectstart: req.body.projectstart,
                projectend: req.body.projectend,
                employees: req.body.employees,

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
