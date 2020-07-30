var {UserModel} = require('../models/user');
var {SharePriceModel} = require('../models/sharePrice');
var mongoose = require('mongoose');
const bcrypt = require("bcrypt");


console.log('This script seeds startup data into the db.');

const mongoDB =  "mongodb://localhost:27017/1exchange";
mongoose.Promise = global.Promise;

var dbSeeder =  async function() {

    try {

        let password = await bcrypt.hash("St3rl1ng@124", 10)

        await mongoose.connect(mongoDB, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            reconnectTries: Number.MAX_VALUE,
            reconnectInterval: 500
        });

        await UserModel.remove({})
      await SharePriceModel.remove({})
        
      await UserModel.create({
        username : "STTokenAdmin",
        password : password,
        userRole : "SuperAdmin",
        address : "0x1d7DE4b6B0646871C8698D2b752415bEd18f97D6"
      })

      await SharePriceModel.create({
        username : "STTokenAdmin",
        price : '2'
      })

     mongoose.disconnect()

    } catch (error) {
        console.log('error >>> ', error)
    }
        
}

dbSeeder()