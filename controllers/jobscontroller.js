const router = require('express').Router();
const { models } = require('../models');

// IMAGE UPLOAD
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const s3 = new aws.S3();

aws.config.update({
    region: process.env.AWS_REGION,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    signatureVersion: 'v4'
})

const upload = multer({
    storage: multerS3({
        s3: s3,
        acl: process.env.AWS_ACL_MODE,
        bucket: process.env.AWS_BUCKET,
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            console.log(file);
            cb(null, path.basename(file.originalname, path.extname(file.originalname)) + '-' + Date.now() + path.extname(file.originalname))
        }
    })
})

const createTransporter = async () => {
    const oauth2Client = new OAuth2Client(
        process.env.OAUTH_CLIENT_ID,
        process.env.OAUTH_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    })

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                reject('Failed to create access token:', err);
            }
            resolve(token);
        })
    })

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: `${process.env.GMAIL_ACCOUNT}`,
            pass: `${process.env.GMAIL_AUTH}`,
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
    });

    return transporter;
}

router.post('/upload', upload.single('attachment'), async (req, res) => {

    const mailBody = `You've received an employee interest form submission. Please review the attached resume and contact ${req.body.firstName} ${req.body.lastName} at ${req.body.email}.
    `;  

    const mailOptions = {
        from: 'zach@dreamgreene.com',
        to: 'maynard.zach23@gmail.com',
        // bcc: 'development@dreamgreene.com',
        subject: 'Employee Interest Form Submission',
        text: mailBody,
        attachments: [
            {
                filename: req.file.name,
                path: req.file.location
            }
        ]
    }

    const bodyObj = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        fileAttachment: req.file.location
    }

    models.JobsModel.create(bodyObj)
        .then(info => {
            res.status(201).json(info);
        })
        .catch(err => res.json(err))
        
    try {
        let emailTransporter = await createTransporter();

        emailTransporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    } catch (error) {
        return console.log(error);
    }

})

module.exports = router;