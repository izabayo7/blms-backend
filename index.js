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
const basePath = process.env.BASE_PATH

const swaggerOptions = {
    swaggerDefinition: {

        info: {
            title: "KURIOUS APIs 📖",
            version: '1.0.0',
            description: "Explore APIs as you wish",
        },
        schemes: ['http'],
        host: host,
        basePath: basePath,
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
// const superAdminController = require('./controllers/superAdmin/superAdmin.controller')
// const adminController = require('./controllers/admin/admin.controller')
// const instructorController = require('./controllers/instructor/instructor.controller')
// const studentController = require('./controllers/student/student.controller')
// const facultyCollegeYearController = require('./controllers/faculty-college-year/faculty-college-year.controller')
// const studentFacultyCollegeYearController = require('./controllers/student-faculty-college-year/student-faculty-college-year.controller')
// const instructorFacultyCollegeYearController = require('./controllers/instructor-faculty-college-year/instructor-faculty-college-year.controller')
// const studentProgressController = require('./controllers/studentProgress/studentProgress.controller')
// const courseController = require('./controllers/course/course.controller')
// const chapterController = require('./controllers/chapter/chapter.controller')
// const messageController = require('./controllers/message/message.controller')
// const fileController = require('./controllers/file/file.controller')
// const quizController = require('./controllers/quiz/quiz.controller')
// const quizSubmissionController = require('./controllers/quizSubmission/quizSubmission.controller')
// const notificationController = require('./controllers/notification/notification.controller')
// const userNotificationController = require('./controllers/user_notification/user_notification.controller')
// const chatGroupController = require('./controllers/chat-group/chat-group.controller')
const user_controller = require('./controllers/user/user.controller')
const user_category_controller = require('./controllers/user_category/user_category.controller')
const user_role_controller = require('./controllers/user_role/user_role.controller')
const college_controller = require('./controllers/college/college.controller')
const college_year_controller = require('./controllers/college_year/college_year.controller')
const faculty_controller = require('./controllers/faculty/faculty.controller')
const faculty_college_controller = require('./controllers/faculty_college/faculty_college.controller')

// use middlewares
app.use(cors())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

// create an http server
const http = require('http');
const server = http.createServer(app);

// importing our socket
const io = require('./utils/socket');
io.listen(server)

// Serve the chatdemo
app.use('/chat-demo', express.static(path.join(__dirname, 'chatDemo')));

app.get("/", express.static(path.join(__dirname, 'views')))

// app.use('/kurious/super-admin', superAdminController)
// app.use('/kurious/admin', adminController)
// app.use('/kurious/college', collegeController)
// app.use('/kurious/instructor', instructorController)
// app.use('/kurious/student', studentController)
// app.use('/kurious/faculty-college-year', facultyCollegeYearController)
// app.use('/kurious/student-faculty-college-year', studentFacultyCollegeYearController)
// app.use('/kurious/instructor-faculty-college-year', instructorFacultyCollegeYearController)
// app.use('/kurious/studentProgress', studentProgressController)
// app.use('/kurious/course', courseController)
// app.use('/kurious/chapter', chapterController)
// app.use('/kurious/message', messageController)
// app.use('/kurious/file', fileController)
// app.use('/kurious/quiz', quizController)
// app.use('/kurious/quiz-submission', quizSubmissionController)
// app.use('/kurious/notification', notificationController)
// app.use('/kurious/user_notification', userNotificationController)
// app.use('/kurious/chat_group', chatGroupController)
app.use(`${basePath}/user`, user_controller)
app.use(`${basePath}/user_category`, user_category_controller)
app.use(`${basePath}/user_role`, user_role_controller)
app.use(`${basePath}/college`, college_controller)
app.use(`${basePath}/college_year`, college_year_controller)
app.use(`${basePath}/faculty`, faculty_controller)
app.use(`${basePath}/faculty_college`, faculty_college_controller)

// start the server
server.listen(port, () => console.log(`Kurious Server activated on port...${port}`))