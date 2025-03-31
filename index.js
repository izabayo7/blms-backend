// import dependencies
const {
    express,
    cors,
    path
} = require('./utils/imports')

const dotenv = require('dotenv');
dotenv.config();

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// define app
const app = express()

const port = process.env.PORT || 7070
const host = process.env.HOST

const swaggerOptions = {
    swaggerDefinition: {

        info: {
            title: "KURIOUS APIs 📖",
            version: '1.0.0',
            description: "Explore APIs as you wish",
        },
        schemes: ['http'],
        host: host,
        basePath: '/kurious',
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
const facultyController = require('./controllers/faculty/faculty.controller')
const facultyCollegeController = require('./controllers/faculty-college/faculty-college.controller')
const collegeYearController = require('./controllers/collegeYear/collegeYear.controller')
const facultyCollegeYearController = require('./controllers/faculty-college-year/faculty-college-year.controller')
const studentFacultyCollegeYearController = require('./controllers/student-faculty-college-year/student-faculty-college-year.controller')
const instructorFacultyCollegeYearController = require('./controllers/instructor-faculty-college-year/instructor-faculty-college-year.controller')
const studentProgressController = require('./controllers/studentProgress/studentProgress.controller')
const courseController = require('./controllers/course/course.controller')
const chapterController = require('./controllers/chapter/chapter.controller')
const messageController = require('./controllers/message/message.controller')
const fileController = require('./controllers/file/file.controller')
const quizController = require('./controllers/quiz/quiz.controller')
const quizSubmissionController = require('./controllers/quizSubmission/quizSubmission.controller')
const notificationController = require('./controllers/notification/notification.controller')
const userNotificationController = require('./controllers/user_notification/user_notification.controller')
const chatGroupController = require('./controllers/chat-group/chat-group.controller')
const userController = require('./controllers/user/user.controller')

// use middlewares
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// create an http server
const http = require('http');
const server = http.createServer(app);

// importing our socket
const io = require('./utils/socket')
io.listen(server)

// Serve the chatdemo
app.use('/chat-demo', express.static(path.join(__dirname, 'chatDemo')));

app.get("/", (req, res) => {
    res.send("WELCOME TO Kurious 🎓").status(200)
})

app.use('/kurious/super-admin', superAdminController)
app.use('/kurious/admin', adminController)
app.use('/kurious/college', collegeController)
app.use('/kurious/instructor', instructorController)
app.use('/kurious/student', studentController)
app.use('/kurious/faculty', facultyController)
app.use('/kurious/faculty-college', facultyCollegeController)
app.use('/kurious/college-year', collegeYearController)
app.use('/kurious/faculty-college-year', facultyCollegeYearController)
app.use('/kurious/student-faculty-college-year', studentFacultyCollegeYearController)
app.use('/kurious/instructor-faculty-college-year', instructorFacultyCollegeYearController)
app.use('/kurious/studentProgress', studentProgressController)
app.use('/kurious/course', courseController)
app.use('/kurious/chapter', chapterController)
app.use('/kurious/message', messageController)
app.use('/kurious/file', fileController)
app.use('/kurious/quiz', quizController)
app.use('/kurious/quiz-submission', quizSubmissionController)
app.use('/kurious/notification', notificationController)
app.use('/kurious/user_notification', userNotificationController)
app.use('/kurious/chat_group', chatGroupController)
app.use('/kurious/user', userController)

// start the server
server.listen(port, () => console.log(`Kurious Server activated on port...${port}`))