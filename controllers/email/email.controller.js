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
        // logo: 'http://www.rca.ac.rw/images/logo-white-rca.png'
    }
});

exports.sendResetPasswordMail = async (req, res) => {
    try {
        const { email } = req.body;
        const response = {
            body: {
                name: req.body.names,
                email,
                intro: 'Someone hopefully you, has requested to reset the password for your account.<br>',
                action: {
                    instructions: 'Click to complete the process',
                    button: {
                        color: '#1a0c2f',
                        text: 'Reset Your Password',
                        link: 'http://rca.ac.rw/reset-password?email=' + req.body.email + '&' + 'token=' + req.body.token
                    }
                },
                outro: 'This code expires after 24 Hours !'
            },
        };

        const mail = mailGenerator.generate(response);

        const message = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Reset Password',
            html: mail,
        };

        const sent = await transporter.sendMail(message);

        if (sent) return res.send(formatResult(200, `We've sent an email to !!`))
    }
    catch (err) {
        return res.status(500).send(err);
    }
};

