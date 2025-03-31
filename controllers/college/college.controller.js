// import dependencies
const { express, multer, fs, College, validateCollege, normaliseDate, fileFilter, auth, _superAdmin, _admin } = require('../../utils/imports')

// create router
const router = express.Router();

// configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = `./uploads/schools/${req.params.id}`
        return cb(null, dir)
    },
    filename: (req, file, cb) => {
        cb(null, `${normaliseDate(new Date().toISOString())}.${file.originalname.split('.')[file.originalname.split('.').length - 1]}`)
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

// Get college
router.get('/', async (req, res) => {
    const colleges = await College.find();
    try {
        if (colleges.length === 0)
            return res.send('College list is empty').status(404);

        return res.send(colleges).status(200);
    } catch (error) {
        return res.send(error).status(500);
    }
});

// Get college
router.get('/:id', async (req, res) => {
    const college = await College.findOne({ _id: req.params.id });
    try {
        if (!college)
            return res.send(`College ${req.params.id} Not Found`).status(404);
        return res.send(college).status(200);
    } catch (error) {
        return res.send(error).status(500);
    }
});

// post an college
router.post('/', async (req, res) => {
    const { error } = validateCollege(req.body);
    if (error)
        return res.send(error.details[0].message).status(400);

    let college = await College.findOne({ email: req.body.email });
    if (college) {
        fs.remove('./uploads/schools/' + req.body.name, (err) => {
            if (err)
                return res.send(err).status(500)
        })
        return res.send(`College with email ${req.body.email} arleady exist`);
    }

    let newDocument = new College({
        name: req.body.name,
        email: req.body.email,
        profile: req.file === undefined ? undefined : req.file.filename

    });

    const saveDocument = await newDocument.save();
    if (saveDocument) {
        const dir = `./uploads/schools/${saveDocument._id}`
        fs.exists(dir, exist => {
            if (!exist) {
                return fs.mkdir(dir, error => cb(error, dir))
            }
            return cb(null, dir)
        })
        return res.send(saveDocument).status(201);
    }
    return res.send('New College not Registered').status(500);
});

// delete a college
router.delete('/:id', [auth, _superAdmin], async (req, res) => {
    let college = await College.findOne({ _id: req.params.id });
    if (!college)
        return res.send(`College of Code ${req.params.id} Not Found`);
    let deleteDocument = await College.findOneAndDelete({ _id: req.params.id });
    if (!deleteDocument)
        return res.send('College Not Deleted').status(500);
    return res.send(`College ${deleteDocument._id} Successfully deleted`).status(200)
});


// updated a college
router.put('/:id', [auth, _admin], upload.single('profile'), async (req, res) => {
    const { error } = validateCollege(req.body, 'update');
    if (error)
        return res.send(error.details[0].message).status(400);

    // check if college exist
    let college = await College.findOne({ _id: req.params.id });
    if (!college)
        return res.send(`College with code ${req.params.id} doens't exist`);

    if (req.file && college.profile) {
        fs.unlink(`./uploads/schools/${req.params.id}/${college.profile}`, (err) => {
            if (err)
                return res.send(err).status(500)
        })
    }

    if (req.file)
        req.body.profile = req.file.filename;

    const updateDocument = await College.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
    if (updateDocument)
        return res.send(updateDocument).status(201);
    return res.send("Error ocurred").status(500)

});

// export the router
module.exports = router;
