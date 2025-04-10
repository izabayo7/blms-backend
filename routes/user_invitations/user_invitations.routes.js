const express = require('express')
const {DeleteSourceFile} = require("../../controllers/user_invitations/user_invitations.controller");
const {filterUsers} = require("../../middlewares/auth.middleware");
const {createMultipleUserInvitations} = require("../../controllers/user_invitations/user_invitations.controller");
const {
    getAllInvitations,
    createUserInvitation,
    getMyInvitations,
    renewInvitation,
    deleteInvitation,
    acceptOrDenyInvitation,
    getInvitationbyToken
} = require('../../controllers/user_invitations/user_invitations.controller')
const {auth} = require('../../utils/imports')
const router = express.Router()

router.route('/')
    /**
     * @swagger
     * /user_invitations:
     *   get:
     *     tags:
     *       - User_invitation
     *     description: Returns current logged in user_invitations
     *     security:
     *       - bearerAuth: -[]
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
     * /user_invitations:
     *   post:
     *     tags:
     *       - User_invitation
     *     description: Creates a User_invitation
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: body
     *         description: User_invitation fields
     *         in: body
     *         required: true
     *         schema:
     *           properties:
     *             user_group:
     *               type: string
     *             category:
     *               type: string
     *             emails:
     *               type: array
     *               items:
     *                 type: string
     *           required:
     *             - college
     *             - category
     *             - emails
     *     responses:
     *       200:
     *         description: Success
     */
    .post([auth, filterUsers(["ADMIN"]), createUserInvitation])
router.route('/multiple')
    /**
     * @swagger
     * /user_invitations/multiple:
     *   post:
     *     tags:
     *       - User_invitation
     *     description: Creates User_invitations from uploaded file
     *     security:
     *       - bearerAuth: -[]
     *     consumes:
     *       - multipart/form-data
     *     parameters:
     *       - in: formData
     *         name: file
     *         type: file
     *         description: xlsx file with user information
     *     responses:
     *       200:
     *         description: Success
     */
    .post([auth, filterUsers(["ADMIN"]), createMultipleUserInvitations, DeleteSourceFile])

router.route('/all')
    /**
     * @swagger
     * /user_invitations/all:
     *   get:
     *     tags:
     *       - User_invitation
     *     description: Returns all user_invitations
     *     security:
     *       - bearerAuth: -[]
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
    .get([auth, getAllInvitations])

router.route('/:token')
    /**
     * @swagger
     * /user_invitations/{token}:
     *   get:
     *     tags:
     *       - User_invitation
     *     description: Returns a specific user_invitation
     *     parameters:
     *       - name: token
     *         description: User invitation token
     *         in: path
     *         type: string
     *         required: true
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Internal Server Error
     */
    .get(getInvitationbyToken)

router.route('/:token/renew')
    /**
     * @swagger
     * /user_invitations/{token}/renew:
     *   put:
     *     tags:
     *       - User_invitation
     *     description: Extends the expiration time of an invitation
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: token
     *         description: invitation token
     *         in: path
     *         type: string
     *         required: true
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Internal Server Error
     */
    .put([auth, renewInvitation])

router.route('/:token/:action')
    /**
     * @swagger
     * /user_invitations/{token}/{action}:
     *   put:
     *     tags:
     *       - User_invitation
     *     description: Accept or deny user_invitations
     *     parameters:
     *       - name: token
     *         description: invitation token
     *         in: path
     *         type: string
     *         required: true
     *       - name: action
     *         description: action you want to perform
     *         in: path
     *         type: string
     *         required: true
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Internal Server Error
     */
    .put(acceptOrDenyInvitation)


router.route('/:token/delete')
    /**
     * @swagger
     * /user_invitations/{token}/delete:
     *   delete:
     *     tags:
     *       - User_invitation
     *     description: Deletes a user_invitation
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: token
     *         description: invitation token
     *         in: path
     *         type: string
     *         required: true
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Internal Server Error
     */
    .delete([auth, filterUsers(["ADMIN"]), deleteInvitation])

exports.User_invitation_routes = router