// import dependencies
const {
    express,
    cors,
} = require('./utils/imports')

const dotenv = require('dotenv');
dotenv.config();

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// define app
const app = express()

const port = process.env.PORT || 7070
const path = process.env.HOST

const swaggerOptions = {
    swaggerDefinition: {

        info: {
            title: "KURIOUS APIs 📖",
            version: '1.0.0',
            description: "Explore APIs as you wish",
        },
        schemes: ['http'],
        host: path,
        basePath: '/',
        securityDefinitions: {
            bearerAuth: {
                type: 'apiKey',
                name: 'Authorization',
                scheme: 'bearer',
                in: 'header',
            },
        },
    },
    apis: ['./controllers/**/*.js', './controllers/**/**/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use("/documentation", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
const studentFacilityCollegeYearController = require('./controllers/student-facility-college-year/student-facility-college-year.controller')
const studentProgressController = require('./controllers/studentProgress/studentProgress.controller')
const courseController = require('./controllers/course/course.controller')
const chapterController = require('./controllers/chapter/chapter.controller')
const messageController = require('./controllers/message/message.controller')
const fileController = require('./controllers/file/file.controller')
const quizController = require('./controllers/quiz/quiz.controller')
const quizSubmissionController = require('./controllers/quizSubmission/quizSubmission.controller')

// use middlewares
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.get("/", (req, res) => {
    res.send("WELCOME TO Kurious 🎓").status(200)
})

app.use('/kurious/super-admin', superAdminController)
app.use('/kurious/admin', adminController)
app.use('/kurious/college', collegeController)
app.use('/kurious/instructor', instructorController)
app.use('/kurious/student', studentController)
app.use('/kurious/facility', facilityController)
app.use('/kurious/facility-college', facilityCollegeController)
app.use('/kurious/college-year', collegeYearController)
app.use('/kurious/facility-college-year', facilityCollegeYearController)
app.use('/kurious/student-facility-college-year', studentFacilityCollegeYearController)
app.use('/kurious/studentProgress', studentProgressController)
app.use('/kurious/course', courseController)
app.use('/kurious/chapter', chapterController)
app.use('/kurious/message', messageController) // well be renewed
app.use('/kurious/file', fileController)
app.use('/kurious/quiz', quizController)
app.use('/kurious/quizSubmission', quizSubmissionController)

// start the server
app.listen(port, () => console.log(`Kurious Server activated on port...${port}`))