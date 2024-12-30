const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const app = express();

if (process.env.NODE_ENV != 'production') {
  require('dotenv').config({ path: 'config/config.env' });
}

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

const user = require('./src/routes/userRoute');
const product = require('./src/routes/productRoute');

app.use('/api/v1', user);
app.use('/api/v1', product);

module.exports = app;