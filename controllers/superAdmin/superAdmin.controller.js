// import dependencies
const { express, bcrypt, multer, fs, SuperAdmin, validateSuperAdmin, validateUserLogin, hashPassword, normaliseDate, fileFilter, auth, _superAdmin, defaulPassword } = require('../../utils/imports');

// create router
const router = express.Router();

// configure multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    dir = `./uploads/system/superAdmin`
    fs.exists(dir, exist => {
      if (!exist) {
        fs.mkdir(dir, error => cb(error, dir))
      }
      return cb(null, dir)
    })
  },
  filename: (req, file, cb) => {
    cb(null, `superAdmin-${normaliseDate(new Date().toISOString())}.${file.originalname.split('.')[file.originalname.split('.').length - 1]}`)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});


// Get superAdmin
router.get('/', async (req, res) => {
  const superAdmin = await SuperAdmin.findOne();
  try {
    if (!superAdmin)
      return res.send('SuperAdmin not yet registered').status(404);
    return res.send('SuperAdmin is registered').status(200);
  } catch (error) {
    return res.send(error).status(500);
  }
});


// post an superAdmin
router.post('/', async (req, res) => {
  const { error } = validateSuperAdmin(req.body);
  if (error)
    return res.send(error.details[0].message).status(400);

  const availableDocuments = await SuperAdmin.find().countDocuments();
  if (availableDocuments > 0)
    return res.send(`Can't register more than one SuperAdmin to the system`);

  let newDocument = new SuperAdmin({
    surName: req.body.surName,
    otherNames: req.body.otherNames,
    nationalId: req.body.nationalId,
    phone: req.body.phone,
    gender: req.body.gender,
    email: req.body.email,
    phone: req.body.phone,
    password: defaulPassword,
  });

  newDocument.password = await hashPassword(newDocument.password);
  const saveDocument = await newDocument.save();
  if (saveDocument)
    return res.send(saveDocument).status(201);
  return res.send('New SuperAdmin not Registered').status(500);
});

// superAdmin login
router.post('/login', async (req, res) => {
  const { error } = validateUserLogin(req.body);
  if (error)
    return res.send(error.details[0].message).status(400)

  // find superAdmin
  let superAdmin = await SuperAdmin.findOne({ email: req.body.email })
  if (!superAdmin)
    return res.send('Invalid Email or Password').status(400)

  // check if passed password is valid
  const validPassword = await bcrypt.compare(req.body.password, superAdmin.password)
  if (!validPassword)
    return res.send('Invalid Email or Password').status(400)
  // return token
  return res.send(superAdmin.generateAuthToken()).status(200);
});

// updated a superAdmin
router.put('/:id', [auth, _superAdmin], upload.single('profile'), async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  error = validateSuperAdmin(req.body);
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400);

  // check if superAdmin exist
  let superAdmin = await SuperAdmin.findOne({ _id: req.params.id });
  if (!superAdmin)
    return res.send(`SuperAdmin with code ${req.params.id} doens't exist`);

  if (req.file && superAdmin.profile) {
    fs.unlink(`./uploads/system/superAdmin/${superAdmin.profile}`, (err) => {
      if (err)
        return res.send(err).status(500)
    })
  }
  if (req.file)
    req.body.profile = req.file.filename;
  if (req.body.password)
    req.body.password = await hashPassword(req.body.password);
  const updateDocument = await SuperAdmin.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201);
  return res.send("Error ocurred").status(500)

});

// delete a superAdmin
router.delete('/:id', [auth, _superAdmin], async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let superAdmin = await SuperAdmin.findOne({ _id: req.params.id });
  if (!superAdmin)
    return res.send(`SuperAdmin of Code ${req.params.id} Not Found`);
  let deleteDocument = await SuperAdmin.findOneAndDelete({ _id: req.params.id });
  if (!deleteDocument)
    return res.send('SuperAdmin Not Deleted').status(500);
  fs.unlink(`./uploads/system/superAdmin/${superAdmin.profile}`, (err) => {
    if (err)
      return res.send(err).status(500)
  })
  return res.send(`SuperAdmin ${deleteDocument._id} Successfully deleted`).status(200)
});

// export the router
module.exports = router;
