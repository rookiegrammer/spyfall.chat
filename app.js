require('./inc/globals.js')

const express = require('express')
const session = require('express-session')
const app = express()
const socket = express()
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const sharedsession = require("express-socket.io-session")
const crypto = require('crypto')

global.express = express
global.app = app
global.socket = socket
global.bcrypt = bcrypt
global.crypto = crypto

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies
//use sessions for tracking logins
const appSession = session({
  secret: global.config.session_secret,
  resave: true,
  saveUninitialized: false
})
app.use(appSession)

const app_server = app.listen( global.config.app_socket )
const socket_server = socket.listen( global.config.game_socket )
const io = require("socket.io")(socket_server)

const socketSession = sharedsession(appSession, {
    autoSave:true
})

io.use(socketSession)

app.set('view engine', 'ejs')

io.set('authorization', (handshake, callback) => {
	// Check if user logged in
  callback(null, true);
});

io.on('connection', (socket) => {
	console.log('New user connected')

})

global.sck.game = io.of('/game')
global.sck.msg = io.of('/msg')

global.sck.game.use(socketSession)
global.sck.msg.use(socketSession)

require('./routes.js')
require('./inc/functions.js')
require('./inc/api.js')
require('./inc/database.js')

global.sck.game.on('connection', (socket) => {
	socket.on('join', (room, secret) => {
		// Check database
		//
	})
})
