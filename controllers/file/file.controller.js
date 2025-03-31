
// updated a course profiles
router.put('/updateGroupProfilePicture/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if course exist
        const group = await ChatGroup.findOne({
            _id: req.params.id
        })
        if (!group)
            return res.send(formatResult(404, `Group with code ${req.params.id} doens't exist`))

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${group.college}/chat/${req.params.id}`,
        }
        upload(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))
            if (group.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${group.profile}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
                })
            }
            const updateDocument = await ChatGroup.findOneAndUpdate({
                _id: req.params.id
            }, {
                profile: req.file.filename
            }, {
                new: true
            })
            if (updateDocument) {
                updateDocument.profile = `http://${process.env.HOST}/kurious/file/groupProfilePicture/${req.params.id}/${updateDocument.profile}`
                return res.status(201).send(updateDocument)
            }
            return res.send(formatResult(500, "Error ocurred"))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// export the router
module.exports = router