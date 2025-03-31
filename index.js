// import dependencies
const {
    express,
    cors,
    path,
    auth,
    bodyparser
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
        schemes: [process.env.NODE_ENV == 'production' ? 'https' : 'http'],
        host: host,
        basePath: basePath,
        securityDefinitions: {
            bearerAuth: {
                type: 'apiKey',
                name: 'authorization',
                scheme: 'bearer',
                in: 'header',
            },
        },
    },
    apis: ['./controllers/**/*.js', './models/**/*.js', './routes/**/*.js'],

};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use("/documentation", swaggerUi.serve, swaggerUi.setup(swaggerDocs, false, {docExpansion: "none"}));
app.use("/jsdoc", (req,res)=>{
    return res.send(swaggerDocs)
});

// import models
require('./models/mongodb')

// import controllers
const user_controller = require('./controllers/user/user.controller')
const user_category_controller = require('./controllers/user_category/user_category.controller')
const college_controller = require('./controllers/college/college.controller')
const user_group_controller = require('./controllers/user_group/user_group.controller')
const user_faculty_college_year_controller = require('./controllers/user_user_group/user_user_group.controller')
const user_logs_controller = require('./controllers/user_logs/user_logs.controller')
const course_controller = require('./controllers/course/course.controller')
const chapter_controller = require('./controllers/chapter/chapter.controller')
const quiz_controller = require('./controllers/quiz/quiz.controller')
const quiz_submission_controller = require('./controllers/quiz_submission/quiz_submission.controller')
const user_progress_contoller = require('./controllers/user_progress/user_progress.controller')
const notification_controller = require('./controllers/notification/notification.controller')
const user_notification_controller = require('./controllers/user_notification/user_notification.controller')
const chat_group_controller = require('./controllers/chat_group/chat_group.controller')
const message_controller = require('./controllers/message/message.controller')
const comment_controller = require('./controllers/comments/comments.controller')
const live_session_controller = require('./controllers/live_session/live_session.controller')
const {User_invitation_routes} = require('./routes/user_invitations/user_invitations.routes');
const {Post_routes} = require('./routes/posts/posts.route');
const announcement_controller = require('./controllers/announcements/announcements.controller');
const payments_controller = require('./controllers/account_payments/account_payments.controller');
const exam_controller = require('./controllers/exam/exam.controller');
const exam_submission_controller = require('./controllers/exam_submission/exam_submission.controller');
const assignments_controller = require('./controllers/assignment/assignment.controller');
const assignment_submission_controller = require('./controllers/assignment_submission/assignment_submission.controller');
const college_payment_plans_controller = require('./controllers/college_payment_plans/college_payment_plans.controller');

// use middlewares
app.use(cors())

app.use(express.json({
    limit: '50mb'
}));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

// create an http server
let httpServer = require('http');
let server = httpServer.createServer(app);

// importing our socket
const io = require('./utils/socket');
const {filterUsers} = require("./middlewares/auth.middleware");
const {User_feedback_routes} = require('./routes/user_feedbacks/user_feedbacks.routes');
const {Reset_password_routes} = require('./routes/reset_password/reset_password.routes');
const {Faculty_Routes} = require('./routes/faculty/faculty.routes');
io.listen(server)


app.get("/", express.static(path.join(__dirname, 'views')))

app.use(`${basePath}/user`, user_controller)
app.use(`${basePath}/user_category`, user_category_controller)
app.use(`${basePath}/college`, college_controller)
app.use(`${basePath}/faculty`, auth, Faculty_Routes)
app.use(`${basePath}/user_groups`, auth, user_group_controller)
app.use(`${basePath}/user_user_group`, auth, user_faculty_college_year_controller)
app.use(`${basePath}/user_logs`, auth, user_logs_controller)
app.use(`${basePath}/course`, course_controller)
app.use(`${basePath}/chapter`, auth, chapter_controller)
app.use(`${basePath}/quiz`, auth, quiz_controller)
app.use(`${basePath}/quiz_submission`, auth, quiz_submission_controller)
app.use(`${basePath}/exams`, auth, exam_controller)
app.use(`${basePath}/exam_submission`, auth, exam_submission_controller)
app.use(`${basePath}/user_progress`, auth, user_progress_contoller)
app.use(`${basePath}/notification`, auth, notification_controller)
app.use(`${basePath}/user_notification`, auth, user_notification_controller)
app.use(`${basePath}/chat_group`, chat_group_controller)
app.use(`${basePath}/message`, auth, message_controller)
app.use(`${basePath}/comment`, auth, comment_controller)
app.use(`${basePath}/live_session`, auth, live_session_controller)
app.use(`${basePath}/user_invitations`, User_invitation_routes)
app.use(`${basePath}/posts`, Post_routes)
app.use(`${basePath}/feedback`, User_feedback_routes)
app.use(`${basePath}/reset_password`, Reset_password_routes)
app.use(`${basePath}/announcement`, auth, announcement_controller)
app.use(`${basePath}/college_payment_plans`, auth, college_payment_plans_controller)
app.use(`${basePath}/account_payments`, auth, payments_controller)
app.use(`${basePath}/assignments`, auth, assignments_controller)
app.use(`${basePath}/assignment_submission`, auth, assignment_submission_controller)

// change faculty to faculty college

// serve assets
app.use(
    "/assets",
    express.static(path.join(__dirname, "views/assets"))
);


// start the server
server.listen(port, () => {
    if (process.env.DEBUG == "false") {
        console.log = function () {
        }
    }
    console.log(`Kurious Server activated on port...${port}`)
})
