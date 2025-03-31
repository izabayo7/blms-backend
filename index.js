// import dependencies
const { express, cors, auth, fs, bodyparser } = require('./utils/imports')

// define app
const app = express()

// import models
require('./models/mongodb')

// import controllers
const superAdminController = require('./controllers/superAdmin/superAdmin.controller')
const collegeController = require('./controllers/college/college.controller')
const adminController = require('./controllers/admin/admin.controller')
const instructorController = require('./controllers/instructor/instructor.controller')
const studentController = require('./controllers/student/student.controller')
const facilityController = require('./controllers/facility/facility.controller')
const facilityCollegeController = require('./controllers/facility-college/facility-college.controller')
const collegeYearController = require('./controllers/collegeYear/collegeYear.controller')
const facilityCollegeYearController = require('./controllers/facility-college-year/facility-college-year.controller')
const courseController = require('./controllers/course/course.controller')
const chapterController = require('./controllers/chapter/chapter.controller')
const messageController = require('./controllers/message/message.controller')
const fileController = require('./controllers/file/file.controller')

// use middlewares
// app.use(bodyparser.urlencoded({ extended: true }))
// app.use(bodyparser.json())
app.use(cors())
// for parsing multipart/form-data 
// app.use(express.static('public'))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("WELCOME TO Kurious").status(200)
})
app.use('/uploadtests', (req, res) => {
    return res.sendFile(__dirname + '/index.html')
})

var multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(req.body)
        const dir = `./uploads`
            return cb(null, dir)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

app.use('/kurious/superAdmin', superAdminController)
app.use('/kurious/admin', adminController)
app.use('/kurious/college', collegeController)
app.use('/kurious/instructor', instructorController)
app.use('/kurious/student', studentController)
app.use('/kurious/facility', facilityController)
app.use('/kurious/facility-college', facilityCollegeController)
app.use('/kurious/collegeYear', collegeYearController)
app.use('/kurious/facility-college-year', facilityCollegeYearController)
app.use('/kurious/course', courseController)
app.use('/kurious/chapter', chapterController)
app.use('/kurious/message', messageController)
app.use('/kurious/file', fileController)

// define the port
const port = process.env.PORT || 7070

// start the server
app.listen(port, () => console.log(`Kurious Server activated on port...${port}`))
