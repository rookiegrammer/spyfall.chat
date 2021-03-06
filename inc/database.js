// Import the mongoose module
const mongoose = require('mongoose');

// Set up default mongoose connection
const mongoDB = global.config.db;
mongoose.connect(mongoDB, { useNewUrlParser: true })

// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise

// Get the default connection
const db = mongoose.connection
global.db = db

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

global.mongoose = mongoose

require('./schemas/user.js')
require('./schemas/room.js')
require('./schemas/message.js')
require('./schemas/connections.js') 
