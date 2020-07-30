const redis = require('redis')
const { promisify } = require('util')
const { GetLoggerInstance, Errors, HttpStatus } = require('./utils')
const { Config } = require('./config')


function RedisClient() {
  const client = redis.createClient()
  client.on('connect', () => {
    console.log(`Connected to redis server`)
    GetLoggerInstance().info(`Connected to redis server`)
  })
  return client
}
const Client = RedisClient()

exports.AddOrUpdateUserCache = async (user) => {
  try {
    const users = await getAsync('ST_users')
    if (users != null && JSON.parse(users).length > 0) {
      const users = JSON.parse(users)
      users[user._id] = user
      await this.AddToCache('ST_users', users)
    }
  } catch (error) {
    let err = { 
      errCode :  Errors.CACHEERROR,
      statusCode : HttpStatus.SERVER_ERROR,
      error
    }
    GetLoggerInstance().warn(`Error With Redis Operetion : ${JSON.stringify(err)}`)
  }
}

exports.AddToCache = async (key, value) => {
  try {
    const setAsync = promisify(Client.set).bind(Client)
    let setResult = await setAsync(key, JSON.stringify(value),'EX', 60*60*24)
    return setResult
  } catch (error) {
    let err = { 
      errCode :  Errors.CACHEERROR,
      statusCode : HttpStatus.SERVER_ERROR,
      error
    }
    GetLoggerInstance().warn(`Error With Redis Operetion : ${JSON.stringify(err)}`)
  }
}

exports.GetFromCache = async (key) => {
  try {
    
    const getAsync = promisify(Client.get).bind(Client)
    const cacheItem = await getAsync(key)
    return cacheItem
    
  } catch (error) {
    let err = { 
      errCode :  Errors.CACHEERROR,
      statusCode : HttpStatus.SERVER_ERROR,
      error
    }    
    GetLoggerInstance().warn(`Error With Redis Operetion : ${JSON.stringify(err)}`)
  }
}