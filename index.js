/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-globals */
/**
 * Module dependencies.
 */

const debug = require('debug')('sterlingToken:server');
const http = require('http');
const https = require('https');
const app = require('./server')
const fs = require("fs")
require('dotenv').config();

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT) || 8080;
const sslPort = normalizePort(process.env.SSLPORT) || 8443;
app.set('port', port);
app.set('sslPort', sslPort);

/**
 * Create HTTP server.
 */
// sslCredentials = {
//     key: fs.readFileSync('./selfsigned.key', 'utf8'),
//     cert: fs.readFileSync('./selfsigned.crt', 'utf8'),
// }

const server = http.createServer(app);
//const sslServer = https.createServer(sslCredentials, app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
//sslServer.listen(sslPort)
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const portVal = parseInt(val, 10);

  if (isNaN(portVal)) {
    // named pipe
    return val;
  }

  if (portVal >= 0) {
    // port number
    return portVal;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}

module.exports = server;
