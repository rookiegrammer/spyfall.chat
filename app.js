require('./inc/globals.js')

const fs = require('fs')
const data = JSON.parse(fs.readFileSync('gamedata.json'))
const express = require('express')
const session = require('express-session')
const app = express()
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const sharedsession = require("express-socket.io-session")
const crypto = require('crypto')
const uintformat = require('biguint-format')
const MongoStore = require('connect-mongo')(session);
const datediff = require('date-diff')

if (data.version)
  console.log('Spyfall.Chat\nDecks version '+data.version)

global.gamedata = data
global.express = express
global.app = app
global.bcrypt = bcrypt
global.crypto = crypto
global.intformat = uintformat
global.datediff = datediff

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies
//use sessions for tracking logins

require('./inc/functions.js')
require('./inc/api.js')
require('./inc/database.js')

const SpyfallConnection = require('./inc/classes/SpyfallConnection.js')

const appSession = session({
  secret: global.config.session_secret,
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: global.db })
})
app.use(appSession)

const http = require('http').Server(app)
const io = require('socket.io')(http)

const socketSession = sharedsession(appSession, {
    autoSave:true
})

io.use(socketSession)

app.set('view engine', 'ejs')
require('./routes.js')

global.sck.game = io.of('/game')
global.sck.msg = io.of('/chat')

global.sck.game.use(socketSession)
global.sck.msg.use(socketSession)

http.listen(3000);

global.sck.game.on('connection', (socket) => {
  /*
    Game Phases
    Phase 0: QA Phase
    Phase 1: After Round Phase
    Phase 2: Spy Guessing Phase
    Phase 3: Accusation Phase
    Phase 4: Tribunal Phase
  */

  new SpyfallConnection(socket)
})

global.sck.msg.on('connection', (socket) => {
  const $ = global.sck.msg

  if (socket.handshake.session && socket.handshake.session.username)
    socket.join(socket.handshake.session.username)

  socket.on('open message', (ack) => {
    if (!socket.handshake.session || !socket.handshake.session.username) {
      return ack(false)
    }

    const username = socket.handshake.session.username
    socket.join(username)

    ack(username)
  })

	socket.on('send message', (user, message, ack) => {
	   // Emit to two rooms from->to and to->from

     if (!socket.handshake.session || !socket.handshake.session.username) {
       return ack(false)
     }

     // Check user if is in database
     global.fn.userExists(user, function(err, exists) {
       if (!exists) return ack(false)

       const the_event = 0
       const from = socket.handshake.session.username
       const to = user
       const date = Date.now()

       const object = {
         event: the_event,
         from: from,
         to: to,
         text: message,
         date: date
       }

       if (from != to)
         $.to(to).emit('receive message', object)

       ack(true)

       // Write to database
       global.fn.saveMessage(the_event, from, to, message, date, null)
     })
	})
})
