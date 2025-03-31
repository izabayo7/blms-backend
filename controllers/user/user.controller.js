// import dependencies
const {
    express,
    Student,
    Search
} = require('../../utils/imports')


// create router
const router = express.Router()

/**
 * @swagger
 * /user/search:
 *   post:
 *     tags:
 *       - Student
 *     description: Search users
 *     parameters:
 *       - name: page
 *         description: page number
 *         in: query
 *         required: true
 *         type: string
 *       - name: limit
 *         description: limit number
 *         in: query
 *         required: true
 *         type: string
 *       - name: query
 *         description: the search query
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.post('/search', async (req, res) => {
    try {

        const {
            data,
            error
        } = await Search(Student, {
            $or: [{
                surName: {
                    $regex: req.body.query,
                    $options: '$i'
                }
            }, {
                otherNames: {
                    $regex: req.body.query,
                    $options: '$i'
                }
            }]
        }, {
            surName: 1,
            otherNames: 1,
            profile: 1,
            email: 1
        }, req.query.page, req.query.limit)
        if (error)
            return res.status(400).send(error)

        res.status(200).send(data)
    } catch (error) {
        console.log(erro)
    }
})

// export the router
module.exports = router