// import dependencies
const { express, Chapter, validateChapter, Course, validateObjectId } = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Chapter:
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       course:
 *         type: string
 *       description:
 *         type: string
 *       number:
 *         type: string
 *       mainVideo:
 *         type: string
 *       liveVideo:
 *         type: string
 *     required:
 *       - name
 *       - course
 *       - description
 */

/**
 * @swagger
 * /kurious/chapter:
 *   post:
 *     tags:
 *       - Chapter
 *     description: Create chapter
 *     parameters:
 *       - name: body
 *         description: Fields for a chapter
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Chapter'
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.post('/', async (req, res) => {

  const { error } = validateChapter(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if course exist
  let course = await Course.findOne({ _id: req.body.course })
  if (!course)
    return res.send(`Course with code ${req.body.course} doens't exist`)

  const number = await Chapter.find({ course: req.body.course }).countDocuments() + 1

  let newDocument = new Chapter({
    name: req.body.name,
    description: req.body.description,
    number: number,
    course: req.body.course
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.send(saveDocument).status(201)
  return res.send('New Chapter not Registered').status(500)
})


/**
 * @swagger
 * /kurious/chapter/{id}:
 *   put:
 *     tags:
 *       - Chapter
 *     description: Update chapter
 *     parameters:
 *       - name: id
 *         description: Chapter id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a chapter
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Chapter'
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.put('/:id', async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  rror = validateChapter(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if chapter exist
  let chapter = await Chapter.findOne({ _id: req.params.id })
  if (!chapter)
    return res.send(`Chapter with code ${req.params.id} doens't exist`)

  const updateDocument = await Chapter.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

/**
 * @swagger
 * /kurious/chapter/{id}:
 *   delete:
 *     tags:
 *       - Course
 *     description: Delete a chapter
 *     parameters:
 *       - name: id
 *         description: Chapter id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let chapter = await Chapter.findOne({ _id: req.params.id })
  if (!chapter)
    return res.send(`Chapter of Code ${req.params.id} Not Found`)
  let deleteDocument = await Chapter.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.send('Chapter Not Deleted').status(500)
  return res.send(`Chapter ${deleteDocument._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
