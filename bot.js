require('dotenv').config()

const Spark = require('sparkbots')
Spark.start({
  prefix: '!',
  token: process.env.TOKEN
})
