const mongoose = require('mongoose');
const socketio = require('socket.io');
const io = require('socket.io-client');
const server = socketio.listen(3001);
const { Config } = require('./config');
const { RabbitMQService } = require('./rabbitmq')

require('dotenv').config();
mongoose.promise = global.promise;

  exports.Mongo = async () => {
    try {
      dbConnect = await mongoose.connect(Config.mongo, {
          keepAlive: true,
          useNewUrlParser: true,
          useCreateIndex: true,
          useFindAndModify: false,
          useUnifiedTopology: true,
          reconnectTries: Number.MAX_VALUE,
          reconnectInterval: 500
        })
        console.log('MongoDB connection successful!') // Use log here
    } catch(error) {
      // Log error
      console.log('MongoDB connection unsuccessful, retry after 5 seconds.')
      setTimeout(this.mongo, 5000)
    }
  },

  exports.Rabbitmq = async () => {
    await RabbitMQService.init(Config.amqp_url);
  }

