const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const { formatResult } = require('../../utils/imports');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

const mailGenerator = new Mailgen({
    theme: 'salted',
    product: {
        name: 'Organiser',
        link: 'https://kurious.rw/',
        logo: 'https://learn.kurious.rw/online-assets/logo.svg'
    }
});

exports.sendInvitationMail = async (req, res) => {
    try {
        const { email } = req.body;
        const response = {
            body: {
                name: req.body.names,
                email,
                intro: 'You was invited on Kurious.<br>',
                action: {
                    instructions: 'Click to complete the process',
                    button: {
                        color: '#1a0c2f',
                        text: 'Reset Your Password',
                        link: 'https://lean.kurious.rw/signup?email=' + req.body.email + '&' + 'token=' + req.body.token
                    }
                },
                outro: 'This code expires after 1 Week !'
            },
        };

        const mail = mailGenerator.generate(response);

        const message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'You was Invited on Kurious', // add message like Cedric invited you to join RCA workspace on Kurious
            html: mail,
        };

        return await transporter.sendMail(message);

    }
    catch (err) {
        return res.status(500).send(err);
    }
};

