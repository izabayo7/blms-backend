const express = require('express')
const { getFacultyStatistics, createFaculty, updateFaculty, deleteFaculty, getFaculties } = require('../../controllers/faculty/faculty.controller')
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
    .post(createFaculty)

router.route('/statistics')
    /**
     * @swagger
     * /faculty/statistics:
     *   get:
     *     tags:
     *       - Statistics
     *     description: Get Faculty statistics
     *     security:
     *       - bearerAuth: -[]
     *     responses:
     *       200:
     *         description: OK
     *       404:
     *         description: Not found
     *       500:
     *         description: Internal Server error
     */
    .get(getFacultyStatistics)

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
     *       - name: faculty_id
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
    .get(getFaculties)
    /**
     * @swagger
     * /faculty/{faculty_id}:
     *   put:
     *     tags:
     *       - Faculty
     *     description: Update Faculty
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: faculty_id
     *         in: path
     *         type: string
     *         description: Faculty's Id
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
    .put(updateFaculty)
    /**
     * @swagger
     * /faculty/{faculty_id}:
     *   delete:
     *     tags:
     *       - Faculty
     *     description: Delete as Faculty
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: faculty_id
     *         description: Faculty's id
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
    .delete(deleteFaculty)
exports.Faculty_Routes = router