const express = require('express')
const { contactUs, requestCallback } = require('../../controllers/user_invitations/user_invitations.controller')
const router = express.Router()

router.route('/contact_us')
    /**
     * @swagger
     * /feedback/contact_us:
     *   post:
     *     tags:
     *       - User_feedback
     *     description: Sends a contact us email to the communication team
     *     parameters:
     *       - name: body
     *         description: User_feedback fields
     *         in: body
     *         required: true
     *         schema:
     *           properties:
     *             user_name:
     *               type: string
     *             user_email:
     *               type: string
     *             message:
     *               type: string
     *           required:
     *             - user_name
     *             - user_email
     *             - message
     *     responses:
     *       200:
     *         description: Success
     */
    .post(contactUs)

router.route('/request_call_back')
    /**
     * @swagger
     * /feedback/request_call_back:
     *   post:
     *     tags:
     *       - User_feedback
     *     description: Sends a call back request email to the communication team
     *     parameters:
     *       - name: body
     *         description: Request callback fields
     *         in: body
     *         required: true
     *         schema:
     *           properties:
     *             user_name:
     *               type: string
     *             institution_name:
     *               type: string
     *             role_at_institution:
     *               type: string
     *               enum:['INSTRUCTOR']
     *             phone_number:
     *               type: string
     *           required:
     *             - user_name
     *             - institution_name
     *             - institution_name
     *             - phone_number
     *     responses:
     *       200:
     *         description: Success
     */
    .post(requestCallback)

exports.User_feedback_routes = router