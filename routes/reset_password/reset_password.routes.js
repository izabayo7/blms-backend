const express = require('express')
const { createPasswordReset, updatePasswordReset, getPasswordResetbyToken } = require('../../controllers/reset_password/reset_password.controller')
const router = express.Router()

router.route('/')
    /**
     * @swagger
     * /reset_password:
     *   post:
     *     tags:
     *       - Auth
     *     description: Creates a password reset
     *     parameters:
     *       - name: body
     *         description: Fields for a password reset
     *         in: body
     *         required: true
     *         schema:
     *           properties:
     *             email:
     *               type: string
     *               required: true
     *     responses:
     *       201:
     *         description: Created
     *       400:
     *         description: Bad Request | Validation Error
     *       500:
     *         description: Internal Server Error
     */
    .post(createPasswordReset)
    /**
     * @swagger
     * /reset_password:
     *   put:
     *     tags:
     *       - Auth
     *     description: Updates a password reset
     *     parameters:
     *       - name: body
     *         description: Fields for upating a password reset
     *         in: body
     *         required: true
     *         schema:
     *           properties:
     *             email:
     *               type: string
     *             token:
     *               type: string
     *             password:
     *               type: string
     *     responses:
     *       201:
     *         description: Created
     *       400:
     *         description: Bad Request | Validation Error
     *       500:
     *         description: Internal Server Error
     */
    .put(updatePasswordReset)

router.route('/:token')
    /**
     * @swagger
     * /reset_password/{token}:
     *   get:
     *     tags:
     *       - Auth
     *     description: Returns a specific password reset
     *     parameters:
     *       - name: token
     *         description: Password reset token
     *         in: path
     *         type: string
     *         required: true
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Internal Server Error
     */
    .get(getPasswordResetbyToken)

exports.Reset_password_routes = router