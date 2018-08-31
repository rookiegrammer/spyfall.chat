require('./inc/globals.js')

const fs = require('fs')
const data = JSON.parse(fs.readFileSync('gamedata.json'))
const express = require('express')
const session = require('express-session')
const app = express()
const socket = express()
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
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

const appSession = session({
  secret: global.config.session_secret,
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: global.db })
})
app.use(appSession)

const http = require('http').Server(app)
const io = require("socket.io")(http)

const socketSession = sharedsession(appSession, {
    autoSave:true
})

io.use(socketSession)

app.set('view engine', 'ejs')
require('./routes.js')

io.on('connection', (socket) => {
  io.on('disconnecting', function(){
   // socket.rooms should isn't empty here
   var rooms = socket.rooms.slice();
 })
})

global.sck.game = io.of('/game')
global.sck.game_priv = io.of('/game-priv')
global.sck.msg = io.of('/chat')

global.sck.game.use(socketSession)
global.sck.msg.use(socketSession)

http.listen(3000);

// on join add roomid to session
// on /game allow join interface

// session object
//  session.username
//  session.rooms
//  session.round_role

global.sck.game.on('connection', (socket) => {
  const space = global.sck.game

  const checkUser = function() {
    return socket.handshake.session && socket.handshake.session.username
  }

  const makeRound = function(roomcode, ack) {
    global.fn.startRound(roomcode, function(err, room) {
      if (err) return ack(err)
      const round = room.currentRound

      // emit ('round_start game')
      space.in(roomcode).emit('round_start game', round.timerStarted)

      // emit ('give_roles game')
      for (var i = 0; i < room.players.length; i++) {
        const player = room.players[i]
        if (round.spy == player.username)
          space.in(roomcode+'+'+player.username).emit('give_role game', {role:'spy'})
        else {
          const role = {
            role: round.roles.get(player.username),
            location: round.location
          }
          space.in(roomcode+'+'+player.username).emit('give_role game', role)
        }
      }

      // timer
      space.in(roomcode+'+'+round.dealer).emit('take_question game')

      ack(true)
    })
  }

  // Object Based

  socket.on('load game', (roomcode, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.connectRoom(roomcode, username, function(err, stateobj) {
      if (err) return ack(err)

      if (!socket.handshake.session.rooms)
        socket.handshake.session.rooms = {};

      if (!socket.handshake.session.rooms[roomcode])
        socket.handshake.session.rooms[roomcode] = {master: stateobj.master}

      ack(stateobj)
    })
  })

  // Response Based (should compare to === true)

  socket.on('open game', (roomcode, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

		// Check database
    global.fn.insideRoom(roomcode, username, function(err, room) {
      if (err)
        return ack(err)

      socket.join(roomcode)
      socket.join(roomcode+'+'+username)

      ack(true)
    })
	})

  socket.on('join game', (roomcode, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username
		// Check database
    global.fn.addToRoom(username, roomcode, function(err, room) {
      if (err) return ack(err)
      socket.to(roomcode).emit('player_joined game', username)
      // Client to use 'open game' upon ack
      ack(true)
    })
	})

  socket.on('start game', (roomcode, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username
		// {open} -> false
    global.fn.closeRoom(username, roomcode, function(err, room) {
      if (err) return ack(err)
      makeRound(roomcode, ack)
      space.in(roomcode).emit('started game')
    })
	})

  socket.on('question game', (roomcode, user, message, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.questionMessage(roomcode, username, user, message, function(err, msg_new) {
      if (err) return ack(err)

      socket.to(roomcode).emit('question_asked game', msg_new)
      ack(true)

      // timer
      space.in(roomcode+'+'+user).emit('take_answer game')
    })
    // start_timer()
    // on timer end emit('answer_failed game')
	})

  socket.on('answer game', (roomcode, answer, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.answerMessage(roomcode, username, answer, function(err, msg_new) {
      if (err) return ack(err)

      socket.to(roomcode).emit('answer_replied game', msg_new)

      ack(true)

      global.fn.checkEnded(roomcode, function(err, round, game) {
        if (err) return

        if (round && game) {
          // wrap up game
        } else if (round) {
          // new round
        }

        // timer

        space.in(roomcode+'+'+username).emit('take_question game')
      })
    })
    // emit('answer_success game')
		// delete {room}
    // remove from user session

    // emit('')

    // emit ('round_end game')
    // emit ('round_start game')
    // emit ('give_roles game')
	})

  socket.on('initiate game', (roomcode) => {

  })

  socket.on('react game', (roomcode, reaction, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.roomReact(roomcode, username, reaction, function(err, reaction) {
      if (err) return ack(err)

      socket.to(roomcode).emit('reacted game', username, reaction)
      ack(true)
    })
  })



})

global.sck.msg.on('connection', (socket) => {
  const $ = global.sck.msg

  if (socket.handshake.session && socket.handshake.session.username)
    socket.join(socket.handshake.session.username)

  socket.on('open message', (ack) => {
    if (!socket.handshake.session || !socket.handshake.session.username) {
      return ack(false)
    }

    // Load messages first in html

    const username = socket.handshake.session.username

    // Use socket io to update/notify
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
