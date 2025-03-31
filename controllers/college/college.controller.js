// import dependencies
const { express, multer, fs, College, validateCollege, normaliseDate, fileFilter, auth, _superAdmin, _admin } = require('../../utils/imports')

// create router
const router = express.Router();

// configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/colleges');
    },
    filename: function (req, file, cb) {
        const fileName = normaliseDate(new Date().toISOString()) + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]
        cb(null, fileName);
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
router.post('/', [auth, _superAdmin], async (req, res) => {
    const { error } = validateCollege(req.body);
    if (error)
        return res.send(error.details[0].message).status(400);

    let college = await College.findOne({ email: req.body.email });
    if (!college)
        return res.send(`College of Code ${req.body.email} arleady exist`);

        // same names ?

    let newDocument = new College({
        name: req.body.name,
        email: req.body.email,
    });

    const saveDocument = await newDocument.save();
    if (saveDocument)
        return res.send(saveDocument).status(201);
    return res.send('New College not Registered').status(500);
});

// delete a college
router.delete('/:id', [auth, _superAdmin], async (req, res) => {
    let college = await College.findOne({ _id: req.params.id });
    if (!college)
        return res.send(`College of Code ${req.params.id} Not Found`);
    let deletedAdmin = await College.findOneAndDelete({ _id: req.params.id });
    if (!deletedAdmin)
        return res.send('College Not Deleted').status(500);
    return res.send(`College ${deletedAdmin._id} Successfully deleted`).status(200)
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
        fs.unlink(__dirname + '../../uploads/profile/college/' + college.profile, (err) => {
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
