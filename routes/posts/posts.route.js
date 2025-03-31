const express = require('express')
const { getAllPosts, getMyPosts, createPost, updatePost, deletePost, updatePostStatus } = require('../../controllers/posts/posts.controller')
const { auth } = require('../../utils/imports')
const router = express.Router()

router.route('/')
    /**
     * @swagger
     * /posts:
     *   get:
     *     tags:
     *       - Post
     *     description: Returns current logged in posts
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
    .get([auth, getMyPosts])
    /**
     * @swagger
     * /posts:
     *   post:
     *     tags:
     *       - Post
     *     description: Creates a Post
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: body
     *         description: Post fields
     *         in: body
     *         required: true
     *         schema:
     *           properties:
     *             title:
     *               type: string
     *             content:
     *               type: string
     *           required:
     *             - title
     *             - content
     *     responses:
     *       200:
     *         description: Success
     */
    .post([auth, createPost])

router.route('/all')
    /**
     * @swagger
     * /posts/all:
     *   get:
     *     tags:
     *       - Post
     *     description: Returns all posts
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
    .get(getAllPosts)

router.route('/:id')
    /**
     * @swagger
     * /posts/{id}:
     *   put:
     *     tags:
     *       - Post
     *     description: Creates a Post
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: id
     *         description: post id
     *         in: path
     *         type: string
     *         required: true
     *       - name: body
     *         description: Post fields
     *         in: body
     *         required: true
     *         schema:
     *           properties:
     *             title:
     *               type: string
     *             content:
     *               type: string
     *           required:
     *             - title
     *             - content
     *     responses:
     *       200:
     *         description: Success
     */
    .post([auth, updatePost])

router.route('/:id/:action')
    /**
     * @swagger
     * /posts/{id}/{action}:
     *   put:
     *     tags:
     *       - Post
     *     description: Change post status
     *     parameters:
     *       - name: id
     *         description: post id
     *         in: path
     *         type: string
     *         required: true
     *       - name: action
     *         description: action you want to perform
     *         in: path
     *         type: string
     *         enum: ['publish', 'unpublish', 'delete']
     *         required: true
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Internal Server Error
     */
    .put([auth, updatePostStatus])


router.route('/:id/delete')
    /**
     * @swagger
     * /posts/{id}/delete:
     *   delete:
     *     tags:
     *       - Post
     *     description: Deletes a Post
     *     security:
     *       - bearerAuth: -[]
     *     parameters:
     *       - name: id
     *         description: post id
     *         in: path
     *         type: string
     *         required: true
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Internal Server Error
     */
    .delete([auth, deletePost])

exports.Post_routes = router