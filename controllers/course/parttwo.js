} else {
    // check if there are quizes made by the user
    let quizes = await findDocuments(Quiz, {
        user: user._id,
        target: {
            $ne: undefined
        }
    })
    if (!quizes.length)
        return res.send(formatResult(404, 'quiz_submissions not found'))

    let foundSubmissions = []

    quizes = await addAttachmentMediaPaths(quizes)

    for (const i in quizes) {

        if (quizes[i].target.type !== 'faculty_college_year') {

            let chapter, course;

            if (quizes[i].target.type === 'chapter') {
                chapter = await findDocument(Chapter, {
                    _id: quizes[i].target.id
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

            quizes[i].target.course = _.pick(course, ['name', 'cover_picture', 'createdAt'])
            quizes[i].target.chapter = chapter ? _.pick(chapter, ['name', 'createdAt']) : '-'
            quizes[i].target.faculty_college_year = course.faculty_college_year

        }
        let quiz_submissions = await findDocuments(Quiz_submission, {
            quiz: quizes[i]._id
        })

        quizes[i].total_submissions = quiz_submissions.length

        if (quiz_submissions.length) {

            quiz_submissions = await injectUser(quiz_submissions, 'user')
            quiz_submissions = await injectUserFeedback(quiz_submissions)

            quizes[i].marking_status = 0
            const percentage_of_one_submission = 100 / quiz_submissions.length

            for (const k in quiz_submissions) {

                if (quiz_submissions[k].marked) {
                    quizes[i].marking_status += percentage_of_one_submission
                }

                quiz_submissions[k].total_feedbacks = 0

                for (const l in quiz_submissions[k].answers) {
                    quiz_submissions[k].total_feedbacks += quiz_submissions[k].answers[l].feedback ? 1 : 0;
                }
            }
            quizes[i].submissions = quiz_submissions
            foundSubmissions.push(quizes[i])
            quizes[i].marking_status += '%'
        }
    }

    if (!foundSubmissions.length)
        return res.send(formatResult(404, 'quiz_submissions not found'))
    result = foundSubmissions
}
