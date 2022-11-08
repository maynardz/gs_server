require('dotenv').config();

const express = require('express');
const app = express();

const dbConnection = require('./db');

const controllers = require('./controllers');
const headers = require('./middleware/headers');
const port = process.env.PORT || 5500;
// const path = require('path');

app.use(express.json());
app.use(headers);
app.use(express.urlencoded({extended: false}));

app.use('/jobs', controllers.jobscontroller);

try {
    dbConnection.authenticate()
        .then(async () => await dbConnection.sync())
        .then(() => {
            app.listen(port, () => {
                console.log(`[SERVER]: App is listening on ${port}`);
            })
        })
} catch (err) {
    console.log(`[SERVER]: Server crashed`);
    console.log(err);
}