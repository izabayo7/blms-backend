const express = require('express')
const { getAllInvitations, createUserInvitation, getMyInvitations } = require('../../controllers/user_invitations/user_invitations.controller')
const { auth } = require('../../utils/imports')
const router = express.Router()

router.route('/')
    /**
     * @swagger
     * /user_invitations:
     *   get:
     *     tags:
     *       - User_invitation
     *     description: Returns current logged in user_invitations
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
    .get([auth, getMyInvitations])
    /**
     * @swagger
     * /users:
     *   post:
     *     tags:
     *       - User_invitation
     *     description: Creates a User_invitation
     *     parameters:
     *       - name: body
     *         description: User_invitation fields
     *         in: body
     *         required: true
     *         schema:
     *           properties:
     *             college:
     *               type: string
     *             category:
     *               type: string
     *             emails:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   name:
     *                     type: string
     *                   is_exam:
     *                     type: boolean
     *                   is_ignored:
     *                     type: boolean
     *                   maximum_marks:
     *                     type: number
     *           required:
     *             - college
     *             - category
     *             - emails
     *     responses:
     *       200:
     *         description: Success
     */
    .post([auth, createUserInvitation])

