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


exports.User_feedback_routes = router