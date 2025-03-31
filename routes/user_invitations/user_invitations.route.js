const express = require('express')
const router = express.Router()

router.route('/')
    /**
     * @swagger
     * /user_invitations:
     *   get:
     *     tags:
     *       - User_invitation
     *     description: Returns all user_invitations
     *     parameters:
     *       - name: page
     *         description: page number
     *         in: query
     *         type: string
     *       - name: limit
     *         description: elements per page
     *         in: query
     *         type: string
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Internal Server Error
     */
    .get(getAllDevices)