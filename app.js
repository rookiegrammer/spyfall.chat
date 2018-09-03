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
      if (err) return ack({message: err.message, status: err.status})
      const round = room.currentRound

      // emit ('round_start game')
      space.in(roomcode).emit('round_start game', round.timerStarted)

      const playerKeys = global.fn.mapKeys(room.players)

      // emit ('give_roles game')
      for (var i = 0; i < playerKeys.length; i++) {
        const player = playerKeys[i]
        if (round.spy == player)
          space.in(roomcode+'+'+player).emit('give_role game', {role:'spy'})
        else {
          const role = {
            role: round.roles.get(player),
            location: round.location
          }
          space.in(roomcode+'+'+player).emit('give_role game', role)
        }
      }

      // timer
      space.in(roomcode).emit('take_question game', round.dealer)

      ack(true)
    })
  }

  const checkPhase = function(room, phase) {
    const round = room.currentRound
    const roomcode = room._id

    if (phase == 2) {
      if (!round.spyGuessed) return false
      round.phase = 2

      room.save(function(err, new_room) {
        space.in(roomcode).emit('change_phase game', round.phase)
        space.in(roomcode+'+'+round.spy).emit('take_location game')
      })

    } else if (phase == 3) {
      if (!round.willAccuse || round.willAccuse.length == 0) return false
      round.phase = 3

      const accuser = round.willAccuse[0]
      room.currentRound.votedBy = accuser

      room.save(function(err, new_room) {
        space.in(roomcode).emit('change_phase game', 3)
        space.in(roomcode+'+'+accuser).emit('take_suspicion game')
      })

    }
    return true
  }

  const wrapUp = function(roomcode) {
    space.in(roomcode).emit('ended game')
  }

  const forceReload = function(roomcode) {
    space.in(roomcode).emit('force_reload game')
  }

  const scoreAndCheck = function(roomcode, scoring) {
    global.fn.roomScoring(roomcode, scoring, function(err, new_room) {
      if (err) return

      space.in(roomcode).emit('update_players game', global.fn.mapToObject(new_room.players) )
      global.fn.checkEnded(roomcode, function(err, round, game, room) {
        if (err) return

        console.log('ended')
        if (game) {
          wrapUp(roomcode)
          console.log('gamewrap')
        } else {
          room.currentRound.phase = 1
          room.save(function(err, new_room) {
            if (err) return
            const lround = new_room.currentRound
            space.in(roomcode).emit('round_end game', lround.location, lround.spy, global.fn.mapToObject(lround.roles))
            space.in(roomcode).emit('change_phase game', 1)
          })
          // makeRound(roomcode, function(err) {
          //   console.log(err)
          // })
        }
      })
    })
  }

  // Object Based ACK

  socket.on('load game', (roomcode, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.connectRoom(roomcode, username, function(err, stateobj) {
      if (err) return ack(false)

      ack(stateobj)
    })
  })

  // Response Based ACK (should compare to === true)

  socket.on('location game', (roomcode, guess, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.checkGuess(roomcode, username, guess, function(err, correct, room) {
      if (err) return ack({message: err.message, status: err.status})
      ack(correct)
      scoreAndCheck(roomcode, correct ? 1 : 2)
    })
  })

  socket.on('suspect game', (roomcode, guess, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username
    global.fn.voteRoom(roomcode, username, guess, function(err, room) {
      if (err) return ack({message: err.message, status: err.status})
      ack(true)

      room.currentRound.votes = {}
      room.currentRound.phase = 4
      room.save(function(err, new_room) {
        if (err) return (console.log(err))

        space.in(roomcode).emit('change_phase game', 4 )
        socket.to(roomcode).emit('take_votes game', username, guess )
      })
    })
  })

  socket.on('vote game', (roomcode, vote, ack) => {
    if ( !checkUser() ) return ack(false)
    const username = socket.handshake.session.username
    global.fn.setCheckVote(roomcode, username, vote, function(err, allvoted, consensus, correct, room) {
      if (err) return ack({message: err.message, status: err.status})
      socket.to(roomcode).emit('has_voted game', username, vote)
      ack(true)
      if (!consensus && !allvoted) return
      if (consensus) {
        space.in(roomcode).emit('votes_succeed game')
        scoreAndCheck(roomcode, correct ? 3 : 4)
      } else {
        space.in(roomcode).emit('votes_failed game')
        const removed = room.currentRound.willAccuse.splice(0,1)
        room.currentRound.hasAccused.push(removed[0])
        if (!checkPhase(room, 3)) {
          room.save(function(err, nn_room) {
            if (err) return
            global.fn.checkEnded(roomcode, function(err, round, game, e_room) {
              if (err) return
              if (round)
                global.fn.roomScoring(roomcode, 0, function(err, new_room) {
                  if (err) return
                  space.in(roomcode).emit('update_players game', global.fn.mapToObject(new_room.players) )

                  if (game)
                    wrapUp(roomcode)
                  else {
                    new_room.currentRound.phase = 1
                    new_room.save(function(err, newnew_room) {
                      if (err) return
                      const lround = newnew_room.currentRound
                      space.in(roomcode).emit('round_end game', lround.location, lround.spy, global.fn.mapToObject(lround.roles))
                      space.in(roomcode).emit('change_phase game', 1)
                    })
                    // makeRound(roomcode, function(err) {
                    //   console.log(err)
                    // })
                  }
                })
              else {
                // recover last answerer
                e_room.currentRound.phase = 0
                e_room.save(function(err, new_room) {
                  if (err) return
                  const msglen = new_room.currentRound.messages.length
                  const lastMsg = new_room.currentRound.messages[msglen-1]
                  space.in(roomcode).emit('change_phase game', 0)
                  space.in(roomcode).emit('take_question game', lastMsg.toUsername)
                })
              }
            })
          })
        }
      }
    })
  })

  socket.on('discuss game', (roomcode, message, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username
    global.fn.discussMessage(roomcode, username, message, function(err, room) {
      if (err)
        return ack({message: err.message, status: err.status})
      ack(true)
      socket.to(roomcode).emit('discussed game', username, message)
    })
  })

  socket.on('open game', (roomcode, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

		// Check database
    global.fn.insideRoom(roomcode, username, function(err, room) {
      if (err)
        return ack({message: err.message, status: err.status})

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
      if (err) return ack({message: err.message, status: err.status})
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
      if (err) return ack({message: err.message, status: err.status})
      makeRound(roomcode, ack)
      space.in(roomcode).emit('started game')
    })
	})

  socket.on('new game', (roomcode, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username
    global.fn.isMaster(username, roomcode, function(err, yes, room) {
      if (err) return ack({message: err.message, status: err.status})
      if (room.currentRound.number != 0)
        makeRound(roomcode, ack)
      else
        ack({message: 'Game has not yet started.', status: 403})
    })
  })

  socket.on('question game', (roomcode, user, message, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.questionMessage(roomcode, username, user, message, function(err, msg_new, room) {

      if (err) return ack({message: err.message, status: err.status})

      socket.to(roomcode).emit('question_asked game', msg_new)
      ack(true)

      // timer
      space.in(roomcode).emit('take_answer game', user)


    })
    // start_timer()
    // on timer end emit('answer_failed game')
	})

  socket.on('answer game', (roomcode, answer, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.answerMessage(roomcode, username, answer, function(err, msg_new, room) {
      if (err) return ack({message: err.message, status: err.status})

      socket.to(roomcode).emit('answer_replied game', msg_new)

      ack(true)

      if (checkPhase(room, 2)) return

      global.fn.checkEnded(roomcode, function(err, endedRound, game) {
        if (err) return

        if (endedRound) {
          global.fn.roomAccuse(roomcode, function(err, new_room) {
            if (err) return
            checkPhase(new_room, 3)
          })
          return
        } else if (checkPhase(room, 3)) return

        space.in(roomcode).emit('take_question game', username)
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

  socket.on('initiate game', (roomcode, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.userInterrupt(roomcode, username, function(err, isSpy) {
      if (err) return ack({message: err.message, status: err.status})

      socket.to(roomcode).emit('initiated game', isSpy)
      ack(true)
    })
  })

  socket.on('react game', (roomcode, reaction, ack) => {
    if ( !checkUser() ) return ack(false)

    const username = socket.handshake.session.username

    global.fn.roomReact(roomcode, username, reaction, function(err, reaction) {
      if (err) return ack({message: err.message, status: err.status})

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
