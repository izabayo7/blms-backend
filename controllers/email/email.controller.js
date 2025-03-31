const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const {formatResult} = require('../../utils/imports');
const {createTransport} = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
const {assingment_expiration} = require("../../utils/emailGenerator");
const {announcement_email} = require("../../utils/emailGenerator");
const {live_scheduled_email} = require("../../utils/emailGenerator");
const {marks_release_email} = require("../../utils/emailGenerator");
const {confirm_email} = require("../../utils/emailGenerator");
const {confirm_account} = require("../../utils/emailGenerator");
const {submission_email} = require("../../utils/emailGenerator");
const {
    invitationToSystem,
    contactUs,
    requestCallback,
    reset_password,
    confirmation_email,
    invitationToUserGroup
} = require('../../utils/emailGenerator');
// const ProtonMail = require('protonmail-api');


// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     port: 465,
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.PASSWORD
//     }
// });

const transporter = createTransport(smtpTransport({
    host: "mail.kurious.rw",
    port: 25,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
}));

// let transporter

// const mailGenerator = new Mailgen({
//     theme: 'salted',
//     product: {
//         name: 'Kurious',
//         link: 'https://kurious.rw/',
//         logo: 'https://elearning.rw/online-assets/logo.svg'
//     }
// });

exports.sendUserGroupInvitationMail = async ({
    names,
                                        email, user_names,
                                        user_group_name,
                                        user_type,
                                    }) => {
    try {

        const mail = invitationToUserGroup({
            user_names,
            user_group_name,
            user_type
        })

        const message = {
            from: process.env.EMAIL,
            to: email,
            subject: names + ' Added you in ' + user_group_name,
            html: mail,
        };

        return {
            sent: await transporter.sendMail(message)
            // sent: await transporter.sendEmail(message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};
exports.sendInvitationMail = async ({email, token, names, institution, user_group}) => {
    try {

        const mail = invitationToSystem({inviter: names, institution, token, user_group})

        const message = {
            from: process.env.EMAIL,
            to: email,
            subject: names + ' Invited you to join Kurious', // add message like Cedric invited you to join RCA workspace on Kurious
            html: mail,
        };

        return {
            sent: await transporter.sendMail(message)
            // sent: await transporter.sendEmail(message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendContactUsEmail = async ({user_name, user_email, message}) => {
    try {

        const mail = contactUs({user_name, user_email, message})

        const _message = {
            from: process.env.EMAIL,
            to: process.env.COMMUNICATION_TEAM_EMAIL,
            subject: 'Contacted by ' + user_name,
            html: mail,
        };

        return {
            sent: await transporter.sendMail(_message)
            // sent: await transporter.sendEmail(message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendRequestCallback = async ({user_name, institution_name, role_at_institution, phone_number}) => {
    try {

        const mail = requestCallback({user_name, institution_name, role_at_institution, phone_number})

        const message = {
            from: process.env.EMAIL,
            to: process.env.COMMUNICATION_TEAM_EMAIL,
            subject: user_name + ' requested a callback.',
            html: mail,
        };

        return {
            sent: await transporter.sendMail(message)
            // sent: await transporter.sendEmail(message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendResetPasswordEmail = async ({email, token, user_name, institution_name}) => {
    try {

        const mail = reset_password({user_name, institution_name, token})

        const message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Reset your password',
            html: mail,
        };

        return {
            sent: await transporter.sendMail(message)
            // sent: await transporter.sendEmail(message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendConfirmEmail = async ({email, user_name, institution_name, institution_email, subscription}) => {
    try {

        const mail = confirmation_email({user_name, institution_name, institution_email, subscription})
        const _message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Account creation succeeded.',
            html: mail,
        };

        return {
            sent: await transporter.sendMail(_message)
            // sent: await transporter.sendEmail(message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendCollegeAccepted = async ({email, user_name, token}) => {
    try {

        const mail = confirm_account({user_name, token})
        const _message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Submission accepted.',
            html: mail,
        };

        return {
            sent: await transporter.sendMail(_message)
            // sent: await transporter.sendEmail(message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendEmailConfirmation = async ({email, user_name, token}) => {
    try {

        const mail = confirm_email({user_name, token})
        const _message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Email confirmation.',
            html: mail,
        };

        return {
            sent: await transporter.sendMail(_message)
            // sent: await transporter.sendEmail(message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendReleaseMarskEmail = async ({
                                           email,
                                           user_names,
                                           instructor_names,
                                           assignment_name,
                                           assignment_type,
                                           link
                                       }) => {
    try {

        const mail = marks_release_email({user_names, instructor_names, assignment_name, assignment_type, link})
        const _message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Marks Released.',
            html: mail,
        };

        return {
            sent: await transporter.sendMail(_message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendAssignmentExpirationEmail = async ({
                                                   email,
                                                   user_names,
                                                   assignment_name,
                                                   link
                                               }) => {
    try {

        const mail = assingment_expiration({user_names, assignment_name, link})
        const _message = {
            from: process.env.EMAIL,
            to: email,
            subject: `Assignment ${assignment_name} is expiring in 2 hours`,
            html: mail,
        };

        return {
            sent: await transporter.sendMail(_message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendLiveScheduledEmail = async ({
                                            email,
                                            user_names,
                                            instructor_names,
                                            course_name,
                                            chapter_name,
                                            date,
                                            time
                                        }) => {
    try {

        const mail = live_scheduled_email({user_names, instructor_names, course_name, chapter_name, date, time})
        const _message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'New Live session.',
            html: mail,
        };

        return {
            sent: await transporter.sendMail(_message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};

exports.sendAnnouncementEmail = async ({
                                           email,
                                           user_names,
                                           announcer,
                                           link,
                                       }) => {
    try {

        const mail = announcement_email({user_names, announcer, link})
        const _message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'New Announcement.',
            html: mail,
        };

        return {
            sent: await transporter.sendMail(_message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};


exports.sendSubmissionEmail = async ({
                                         user_name,
                                         institution_name,
                                         institution_email,
                                         subscription,
                                         token,
                                         user_email,
                                         user_phone,
                                         max_users,
                                     }) => {
    try {

        const mail = submission_email({
            user_name,
            institution_name,
            institution_email,
            subscription,
            token,
            user_email,
            user_phone,
            max_users,
        })
        const _message = {
            from: process.env.EMAIL,
            to: process.env.COMMUNICATION_TEAM_EMAIL,
            subject: 'New college registered.',
            html: mail,
        };

        return {
            sent: await transporter.sendMail(_message)
            // sent: await transporter.sendEmail(message)
        }

    } catch (err) {
        return {
            err: err
        }
    }
};