// Package Dependencies
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const { AllocationJob } = require("./cronJob")
const { Mongo, Rabbitmq, Socket, GetLoggerInstance, HttpStatus, Errors, ApiResponse, GetCodeMsg, Subscribe } = require("./utils")
// const { Subscribe } = require("./services")
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
 

// Start Services
const app = express();
require("dotenv").config();
response = new ApiResponse()
Mongo();
Rabbitmq();
Subscribe();
AllocationJob();

// Setup Access Log
const accessLogStream = fs.createWriteStream(path.join(__dirname, "logs/access.log"), { flags: "a" })

// Midelware stack
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// var whitelist = ['https://pass.sterling.ng', 'http://localhost', 'https://localhost', 'http://127.0.0.1']
// var corsOptionsDelegate = function (req, callback) {
//   var corsOptions;
//   if (whitelist.indexOf(req.header('Origin')) !== -1) {
//     corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
//   } else {
//     corsOptions = { origin: false } // disable CORS for this request
//   }
//   callback(null, corsOptions) // callback expects two parameters: error and options
// }

app.use(cors());
app.use(compression());
app.use(logger("combined", { stream: accessLogStream }));
app.use(express.static('uploads'))
global.__appbasedir = __dirname;

/* Application Routes */
let swaggerOption = {
  
}
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOption));
app.use("/api/v1", require("./routes"));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(response.PlainError(Errors.NOTFOUNDERROR, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.NOTFOUNDERROR), {error : "Page not found error"}))
});

// error handler
app.use((err, req, res, next) => {

  if (process.env.APPENV == "development") {
    console.log(err)
  }
  
  err.stack = err.stack.toString()
  GetLoggerInstance().error(JSON.stringify(err));
  const statusCode = err.statusCode

  delete err.stack;
  delete err.level;
  delete err.timestamp 
  delete err.statusCode

  res.status( statusCode || HttpStatus.SERVER_ERROR).json(err)
});

module.exports = app;
