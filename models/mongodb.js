const {
  mongoose
} = require('../utils/imports')
const dbHost = process.env.MONGO_URI
// connect to mongodb server
mongoose.connect(dbHost, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log('Successfully connected to Database '))
  .catch(err => console.log('Failed to Connect to Database', err))
mongoose.set('useFindAndModify', false)