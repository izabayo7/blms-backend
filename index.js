// import dependencies
const { 
    express,
    cors,
    db,
    bodyparser,
    superAdminController,
    adminController,
    collegeController,
    instructorController,
    studentController,
    facilityController,
    facilityCollegeController,
    collegeYearController,
    facilityCollegeYearController,
    courseController,
    chapterController
} = require('./utils/imports')

// define app
const app = express()

// import models
require('./models/mongodb')

// use middlewares
app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())
app.use(cors())

app.get("/", (req, res) => {
    res.send("WELCOME TO Kurious").status(200)
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

// define the port
const port = process.env.PORT || 7070

// start the server
app.listen(port, () => console.log(`Kurious Server activated on port...${port}`))
