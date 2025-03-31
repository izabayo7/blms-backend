const { mongoose } = require('../utils/imports')
const dbHost = process.env.MONGO_URI
// connect to mongodb server
mongoose.connect(`mongodb://${dbHost}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Successfully connected to Database '))
  .catch(err => console.log('Failed to Connect to Database', err))
mongoose.set('useFindAndModify', false)


require('./admin/admin.model')
require('./college/college.model')
require('./instructor/instructor.model')
require('./student/student.model')
require('./superAdmin/superAdmin.model')
