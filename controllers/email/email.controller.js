const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const { formatResult } = require('../../utils/imports');
const { invitationToSystem } = require('../../utils/emailGenerator');
const ProtonMail = require('protonmail-api');


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
        const response = {
            body: {
                name: names,
                email,
                intro: 'invited on Kurious.<br>',
                action: {
                    instructions: 'Click to complete the process',
                    button: {
                        color: '#1a0c2f',
                        text: 'View invitation',
                        link: 'https://kurious.rw/auth/register?token=' + token
                    }
                },
                outro: 'This code expires after 1 Week !'
            },
        };

        // const mail = mailGenerator.generate(response);

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
        console.log(err)
        return {
            err: err
        }
    }
};

