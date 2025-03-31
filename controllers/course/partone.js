router.get('/user/:user_name/:quiz_name', async (req, res) => {
    try {

        // check if user exist
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let quiz = await findDocument(Quiz, {
            name: req.params.quiz_name
        }, undefined, true)
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        quiz = await addAttachmentMediaPaths([quiz])
        quiz = quiz[0]


        if (quiz.target.type !== 'faculty_college_year') {

            let chapter, course;

            if (quiz.target.type === 'chapter') {
                chapter = await findDocument(Chapter, {
                    _id: quiz.target.id
                }, u, true)
                course = await findDocument(Course, {
                    _id: chapter.course
                })
            }
            course = await findDocument(Course, {
                _id: chapter ? chapter.course : quiz.target.id
            })

            course = await injectFaculty_college_year([course])
            course = course[0]

            quiz.target.course = _.pick(course, ['name', 'cover_picture', 'createdAt'])
            quiz.target.chapter = chapter ? _.pick(chapter, ['name', 'createdAt']) : '-'
            quiz.target.faculty_college_year = course.faculty_college_year

        }

        let result = await findDocument(Quiz_submission, {
            user: user._id,
            quiz: quiz._id
        })
        if (!result)
            return res.send(formatResult(404, 'quiz_submission not found'))

        result[0].quiz = simplifyObject(result[0].quiz)
        result[0].quiz = await injectUser(result[0].quiz, 'user')
        result = await injectUser(result, 'user')
        result[0].quiz = result[0].quiz[0]
        result = await injectUserFeedback(result)
        result = result[0]
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})
