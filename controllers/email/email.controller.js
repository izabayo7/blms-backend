const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const { formatResult } = require('../../utils/imports');
const { invitationToSystem, contactUs, requestCallback, reset_password } = require('../../utils/emailGenerator');
// const ProtonMail = require('protonmail-api');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// let transporter

const mailGenerator = new Mailgen({
    theme: 'salted',
    product: {
        name: 'Kurious',
        link: 'https://kurious.rw/',
        logo: 'https://learn.kurious.rw/online-assets/logo.svg'
    }
});

exports.sendInvitationMail = async ({ email, token, names, institution }) => {
    try {

        const mail = invitationToSystem({ inviter: names, institution, token })

        const message = {
            from: process.env.EMAIL,
            to: email,
            subject: names + ' Invited you to join Kurious', // add message like Cedric invited you to join RCA workspace on Kurious
            html: mail,
        };

        /*
            {
                "college": "5f8f38ad558d86f96186daf0",
                "category": "STUDENT",
                "emails": [
                    "nadibire08@gmail.com"
                ]
            }
        */

        // transporter = await ProtonMail.connect({
        //     username: process.env.EMAIL,
        //     password: process.env.PASSWORD
        // })

        return {
            sent: await transporter.sendMail(message)
            // sent: await transporter.sendEmail(message)
        }

    }
    catch (err) {
        return {
            err: err
        }
    }
};

exports.sendContactUsEmail = async ({ user_name, user_email, message }) => {
    try {

        const mail = contactUs({ user_name, user_email, message })

        const _message = {
            from: process.env.EMAIL,
            to: process.env.COMMUNICATION_TEAM_EMAIL,
            subject: 'Contacted by ' + user_name,
            html: mail,
        };

        /*
            {
                "college": "5f8f38ad558d86f96186daf0",
                "category": "STUDENT",
                "emails": [
                    "nadibire08@gmail.com"
                ]
            }
        */

        // transporter = await ProtonMail.connect({
        //     username: process.env.EMAIL,
        //     password: process.env.PASSWORD
        // })

        return {
            sent: await transporter.sendMail(_message)
            // sent: await transporter.sendEmail(message)
        }

    }
    catch (err) {
        return {
            err: err
        }
    }
};

exports.sendRequestCallback = async ({ user_name, institution_name, role_at_institution, phone_number }) => {
    try {

        const mail = requestCallback({ user_name, institution_name, role_at_institution, phone_number })

        const message = {
            from: process.env.EMAIL,
            to: process.env.COMMUNICATION_TEAM_EMAIL,
            subject: user_name + ' requested a callback.',
            html: mail,
        };

        /*
            {
                "college": "5f8f38ad558d86f96186daf0",
                "category": "STUDENT",
                "emails": [
                    "nadibire08@gmail.com"
                ]
            }
        */

        // transporter = await ProtonMail.connect({
        //     username: process.env.EMAIL,
        //     password: process.env.PASSWORD
        // })

        return {
            sent: await transporter.sendMail(message)
            // sent: await transporter.sendEmail(message)
        }

    }
    catch (err) {
        return {
            err: err
        }
    }
};

exports.sendResetPasswordEmail = async ({ email, token, user_name, institution_name }) => {
    try {

        const mail = reset_password({ user_name, institution_name, token })

        const message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Reset your password',
            html: mail,
        };

        /*
            {
                "college": "5f8f38ad558d86f96186daf0",
                "category": "STUDENT",
                "emails": [
                    "nadibire08@gmail.com"
                ]
            }
        */

        // transporter = await ProtonMail.connect({
        //     username: process.env.EMAIL,
        //     password: process.env.PASSWORD
        // })

        return {
            sent: await transporter.sendMail(message)
            // sent: await transporter.sendEmail(message)
        }

    }
    catch (err) {
        return {
            err: err
        }
    }
};