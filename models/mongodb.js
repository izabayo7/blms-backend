const { mongoose } = require('../utils/imports')

// connect to mongodb server
mongoose.connect('mongodb://localhost/Kurious', {
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
