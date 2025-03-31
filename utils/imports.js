// modules
const Joi = require('joi')
Joi.ObjectId = require('joi-objectid')(Joi)
module.exports.express = require('express')
module.exports.cors = require('cors')
module.exports.bodyparser = require('body-parser')
module.exports.mongoose = require('mongoose')
module.exports.Joi = Joi
module.exports.jwt = require('jsonwebtoken')
module.exports.config = require('config')
module.exports.db = require('../models/mongodb')
module.exports.bcrypt = require('bcryptjs')
module.exports.multer = require('multer')
module.exports.fs = require('fs-extra')

// models & functions
const { SuperAdmin, validateSuperAdmin } = require('../models/superAdmin/superAdmin.model')
const { Admin, validateAdmin } = require('../models/admin/admin.model')
const { College, validateCollege } = require('../models/college/college.model')
const { Instructor, validateInstructor } = require('../models/instructor/instructor.model')
const { Student, validateStudent } = require('../models/student/student.model')
const { Facility, validateFacility } = require('../models/facility/facility.model')
const { facilityCollege, validateFacilityCollege } = require('../models/facility-college/facility-college.model')
const { facilityCollegeYear, validateFacilityCollegeYear } = require('../models/facility-college-year/facility-college-year.model')
const { CollegeYear, validateCollegeYear } = require('../models/collegeYear/collegeYear.model')
const { Course, validateCourse } = require('../models/course/course.model')
const { Chapter, validateChapter } = require('../models/chapter/chapter.model')
const { Message, validateMessage } = require('../models/message/message.model')
const { Attachment, validateAttachment} = require('../models/attachments/attachments.model')
const { hashPassword } = require('./hash')
const { fileFilter } = require('./multer/fileFilter')

module.exports.Admin = Admin
module.exports.validateAdmin = validateAdmin
module.exports.SuperAdmin = SuperAdmin
module.exports.validateSuperAdmin = validateSuperAdmin
module.exports.College = College
module.exports.validateCollege = validateCollege
module.exports.Instructor = Instructor
module.exports.validateInstructor = validateInstructor
module.exports.Student = Student
module.exports.validateStudent = validateStudent
module.exports.Facility = Facility
module.exports.validateFacility = validateFacility
module.exports.FacilityCollege = facilityCollege
module.exports.validateFacilityCollege = validateFacilityCollege
module.exports.CollegeYear = CollegeYear
module.exports.validateCollegeYear = validateCollegeYear
module.exports.FacilityCollegeYear = facilityCollegeYear
module.exports.validateFacilityCollegeYear = validateFacilityCollegeYear
module.exports.Course = Course
module.exports.validateCourse = validateCourse
module.exports.Chapter = Chapter
module.exports.validateChapter = validateChapter
module.exports.Message = Message
module.exports.validateMessage = validateMessage
module.exports.Attachment = Attachment
module.exports.validateAttachment = validateAttachment
module.exports.fileFilter = fileFilter
module.exports.hashPassword = hashPassword
module.exports.validateObjectId = (id) => Joi.validate(id, Joi.ObjectId().required())
module.exports.normaliseDate = (date) => {
    let result = ''
    for (const i in date) { if (date[i] !== ':' && date[i] !== '.' && date[i] !== '-') { result += date[i] } }
    return result
}
module.exports.validateUserLogin = (credentials) => {
    const schema =
    {
        email: Joi.string().email().required(),
        password: Joi.string().min(3).max(255).required()
    };
    return Joi.validate(credentials, schema)
}
module.exports.checkRequirements = async (category, body) => {
    let Users = category === 'SuperAdmin' ? SuperAdmin : category === 'Admin' ? Admin : category === 'Instructor' ? Instructor : Student

    let college = await College.findOne({ _id: body.college })
    if (!college)
        return `College ${body.college} Not Found`
    let user = await Users.findOne({ email: body.email })
    if (user)
        return `${category} with email ${body.email} arleady exist`

    user = await Users.findOne({ nationalId: body.nationalId })
    if (user)
        return `${category} with nationalId ${body.nationalId} arleady exist`

    user = await Users.findOne({ phone: body.phone })
    if (user)
        return `${category} with phone ${body.phone} arleady exist`

    if (category === 'Admin') {
        user = await Users.findOne({ college: body.college })
        if (user)
            return `${category} with college ${body.college} arleady exist`
    }
    return 'alright'
}

module.exports.FindDocument = {}

module.exports.getCollege = async (id, type) => {
    let course = type === 'chapter' ? await Course.findOne({_id: id}) : undefined
    let facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: type === 'chapter' ? course.facilityCollegeYear : id })
    if (!facilityCollegeYear)
        return `facilityCollegeYear ${id} Not Found`
    let facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })
    return facilityCollege.college
}

module.exports.getCourse = async (id) => {
    let chapter = await Chapter.findOne({_id: id})
    return chapter.course
}

// authentication middlewares
const { auth } = require('../middlewares/auth.middleware')
const { admin } = require('../middlewares/admin.middleware')
const { instructor } = require('../middlewares/instructor.middleware')
const { student } = require('../middlewares/student.middleware')
const { superAdmin } = require('../middlewares/superAdmin.middleware')

module.exports.auth = auth
module.exports._admin = admin
module.exports._superAdmin = superAdmin
module.exports._student = student
module.exports._instructor = instructor

// constant lobal variables
module.exports.defaulPassword = `Kurious@${new Date().getFullYear()}`

// controllers
module.exports.superAdminController = require('../controllers/superAdmin/superAdmin.controller')
module.exports.collegeController = require('../controllers/college/college.controller')
module.exports.adminController = require('../controllers/admin/admin.controller')
module.exports.instructorController = require('../controllers/instructor/instructor.controller')
module.exports.studentController = require('../controllers/student/student.controller')
module.exports.facilityController = require('../controllers/facility/facility.controller')
module.exports.facilityCollegeController = require('../controllers/facility-college/facility-college.controller')
module.exports.collegeYearController = require('../controllers/collegeYear/collegeYear.controller')
module.exports.facilityCollegeYearController = require('../controllers/facility-college-year/facility-college-year.controller')
module.exports.courseController = require('../controllers/course/course.controller')
module.exports.chapterController = require('../controllers/chapter/chapter.controller')
module.exports.messageController = require('../controllers/message/message.controller')
module.exports.fileController = require('../controllers/files/files.controller')