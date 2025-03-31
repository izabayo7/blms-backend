const express = require('express')
const router = express.Router()

router.route('/')
    /**
     * @swagger
     * /faculty:
     *   post:
     *     tags:
     *       - Faculty
     *     description: Create Faculty
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: body
     *         description: Fields for a Faculty
     *         in: body
     *         required: true
     *         schema:
     *           properties:
     *             name:
     *               type: string
     *             description:
     *               type: string
     *           required:
     *             - name
     *             - description
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
    .post()

router.route('/:faculty_id')
    /**
     * @swagger
     * /faculty/{faculty_id}:
     *   get:
     *     tags:
     *       - Faculty
     *     description: Returns faculties relevant to the requesting user
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: faculty
     *         description: Faculty Id *use ALL in case you need to see for all faculties
     *         in: path
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
    .get()

exports.Faculty_Routes = router