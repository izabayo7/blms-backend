// import dependencies
const { express, bcrypt, fs, SuperAdmin, validateObjectId, validateSuperAdmin, validateUserLogin, hashPassword, auth, _superAdmin, defaulPassword } = require('../../utils/imports');

// create router
const router = express.Router();



// Get superAdmin
router.get('/', async (req, res) => {
  const superAdmin = await SuperAdmin.find();
  try {
    if (!superAdmin)
      return res.send('SuperAdmin not yet registered').status(404);
    return res.send(superAdmin).status(200);
    // return res.send('SuperAdmin is registered').status(200);
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
router.put('/:id', async (req, res) => {
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

  if (req.body.password)
    req.body.password = await hashPassword(req.body.password);
  const updateDocument = await SuperAdmin.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201);
  return res.send("Error ocurred").status(500)

});

// delete a superAdmin
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let superAdmin = await SuperAdmin.findOne({ _id: req.params.id });
  if (!superAdmin)
    return res.send(`SuperAdmin of Code ${req.params.id} Not Found`);
  let deleteDocument = await SuperAdmin.findOneAndDelete({ _id: req.params.id });
  if (!deleteDocument)
    return res.send('SuperAdmin Not Deleted').status(500);
  if (superAdmin.profile) {
    fs.unlink(`./uploads/system/superAdmin/${superAdmin.profile}`, (err) => {
      if (err)
        return res.send(err).status(500)
    })
  }
  return res.send(`${superAdmin.surName} ${superAdmin.otherNames} was successfully deleted`).status(200)
});

// export the router
module.exports = router;
