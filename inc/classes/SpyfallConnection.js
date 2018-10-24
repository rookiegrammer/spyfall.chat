function SpyfallConnection(socket) {
  const self = this;

  self.socket = socket
  self.space = global.sck.game

  self.socket.on('load game', function() {
    self.eventLoadGame.apply(self, arguments)
  })
  self.socket.on('location game', function() {
    self.eventLocationGame.apply(self, arguments)
  })
  self.socket.on('suspect game', function() {
    self.eventSuspectGame.apply(self, arguments)
  })
  self.socket.on('vote game', function() {
    self.eventVoteGame.apply(self, arguments)
  })
  self.socket.on('discuss game', function() {
    self.eventDiscussGame.apply(self, arguments)
  })
  self.socket.on('open game', function() {
    self.eventOpenGame.apply(self, arguments)
  })
  self.socket.on('join game', function() {
    self.eventJoinGame.apply(self, arguments)
  })
  self.socket.on('start game', function() {
    self.eventStartGame.apply(self, arguments)
  })
  self.socket.on('new game', function() {
    self.eventNewGame.apply(self, arguments)
  })
  self.socket.on('question game', function() {
    self.eventQuestionGame.apply(self, arguments)
  })
  self.socket.on('answer game', function() {
    self.eventAnswerGame.apply(self, arguments)
  })
  self.socket.on('initiate game', function() {
    self.eventInitiateGame.apply(self, arguments)
  })
  self.socket.on('react game', function() {
    self.eventReactGame.apply(self, arguments)
  })
  self.socket.on('disconnect', function() {
    self.eventDisconnect.apply(self, arguments)
  })
}


SpyfallConnection.prototype.getUser = function (socket) {

  if (this.socket.handshake.session)
    return this.socket.handshake.session.username
  return false
}
SpyfallConnection.prototype.makeRound = function(roomcode, ack) {
  global.fn.startRound(roomcode, (err, room) => {
    if (err) return ack({message: err.message, status: err.status})
    const round = room.currentRound

    // emit ('round_start game')
    this.space.in(roomcode).emit('round_start game', round.timerStarted)

    const playerKeys = global.fn.mapKeys(room.players)

    // emit ('give_roles game')
    for (var i = 0; i < playerKeys.length; i++) {
      const player = playerKeys[i]
      if (round.spy == player)
        this.space.in(roomcode+'+'+player).emit('give_role game', {role:'spy'})
      else {
        const role = {
          role: round.roles.get(player),
          location: round.location
        }
        this.space.in(roomcode+'+'+player).emit('give_role game', role)
      }
    }

    ack(true)

    global.fn.startTimeout(roomcode, (err, date) => {
      this.space.in(roomcode).emit('take_question game', round.dealer, date)
    })
  })
}
SpyfallConnection.prototype.checkPhase = function(room, phase) {
  const round = room.currentRound
  const roomcode = room._id

  if (phase == 2) {
    if (!round.spyGuessed) return false
    round.phase = 2

    room.save( (err, new_room) => {
      this.space.in(roomcode).emit('change_phase game', round.phase)

      global.fn.startTimeout(roomcode, (err, date) => {
        this.space.in(roomcode+'+'+round.spy).emit('take_location game')
        this.space.in(roomcode).emit('is_waiting game', date)

      })
    })

  } else if (phase == 3) {
    if (!round.willAccuse || round.willAccuse.length == 0) return false
    round.phase = 3

    const accuser = round.willAccuse[0]
    room.currentRound.votedBy = accuser

    room.save( (err, new_room) => {
      this.space.in(roomcode).emit('change_phase game', 3)
      global.fn.startTimeout(roomcode, (err, date) => {
        this.space.in(roomcode+'+'+accuser).emit('take_suspicion game')
        this.space.in(roomcode).emit('is_waiting game', date)
      })
    })

  }
  return true
}
SpyfallConnection.prototype.wrapUp = function(roomcode) {
  this.space.in(roomcode).emit('ended game')
}
SpyfallConnection.prototype.forceReload = function(roomcode) {
  this.space.in(roomcode).emit('force_reload game')
}
SpyfallConnection.prototype.scoreAndCheck = function(roomcode, scoring, username) {
  global.fn.roomScoring(roomcode, scoring, (err, new_room) => {
    if (err) return

    this.space.in(roomcode).emit('update_players game', global.fn.mapToObject(new_room.players) )
    global.fn.checkEnded(roomcode, (err, round, game, room) => {
      if (err) return

      room.currentRound.phase = 1
      room.save( (err, new_room) => {
        if (err) return
        const lround = new_room.currentRound
        this.space.in(roomcode).emit('round_end game', lround.location, lround.spy, global.fn.mapToObject(lround.roles), username)
        this.space.in(roomcode).emit('change_phase game', 1)
      })

      if (game)
        this.wrapUp(roomcode)
    })
  })
}

SpyfallConnection.prototype.eventLoadGame = function(roomcode, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)
  const socketId = this.socket.id

  global.fn.connectRoom(roomcode, username, (err, stateobj) => {
    if (err) return ack(false)

    global.fn.registerConnection(socketId, username, function(registered) {
      return ack(stateobj)
    })
  })
}
SpyfallConnection.prototype.eventLocationGame = function(roomcode, guess, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.checkGuess(roomcode, username, guess, (err, correct, room) => {
    if (err) return ack({message: err.message, status: err.status})
    ack(correct)
    global.fn.stopTimeout(roomcode, (err) => {
      this.scoreAndCheck(roomcode, correct ? 1 : 2, username)
    })
  })
}
SpyfallConnection.prototype.eventSuspectGame = function(roomcode, guess, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.voteRoom(roomcode, username, guess, (err, room) => {
    if (err) return ack({message: err.message, status: err.status})
    ack(true)

    room.currentRound.votes = {}
    room.currentRound.phase = 4
    room.save( (err, new_room) => {
      if (err) return (console.log(err))

      this.space.in(roomcode).emit('change_phase game', 4 )
      global.fn.startTimeout(roomcode, (err, date) => {
        this.socket.to(roomcode).emit('take_votes game', username, guess, date)
      })
    })
  })
}
SpyfallConnection.prototype.eventVoteGame = function(roomcode, vote, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.setCheckVote(roomcode, username, vote, (err, allvoted, consensus, correct, room) => {
    if (err) return ack({message: err.message, status: err.status})
    this.socket.to(roomcode).emit('has_voted game', username, vote)
    ack(true)
    if (!allvoted) return

    if (consensus) {
      this.space.in(roomcode).emit('votes_succeed game')
      this.scoreAndCheck(roomcode, correct ? 3 : 4, room.currentRound.votedBy)
    } else {
      this.space.in(roomcode).emit('votes_failed game')
      const removed = room.currentRound.willAccuse.splice(0,1)
      room.currentRound.hasAccused.push(removed[0])
      if (!this.checkPhase(room, 3)) {
        room.save( (err, nn_room) => {
          if (err) return
          global.fn.checkEnded(roomcode, (err, round, game, e_room) => {
            if (err) return
            if (round)
              global.fn.roomScoring(roomcode, 0, (err, new_room) => {
                if (err) return
                this.space.in(roomcode).emit('update_players game', global.fn.mapToObject(new_room.players) )

                new_room.currentRound.phase = 1
                new_room.save( (err, newnew_room) => {
                  if (err) return
                  const lround = newnew_room.currentRound
                  this.space.in(roomcode).emit('round_end game', lround.location, lround.spy, global.fn.mapToObject(lround.roles), lround.votedBy)
                  this.space.in(roomcode).emit('change_phase game', 1)
                })

                if (game)
                  this.wrapUp(roomcode)
              })
            else {
              // recover last answerer
              e_room.currentRound.timeoutStarted = null
              e_room.currentRound.phase = 0
              e_room.save( (err, new_room) => {
                if (err) return
                const msglen = new_room.currentRound.messages.length
                const lastMsg = new_room.currentRound.messages[msglen-1]
                this.space.in(roomcode).emit('change_phase game', 0)
                global.fn.startTimeout(roomcode, (err, date) => {
                  this.space.in(roomcode).emit('take_question game', lastMsg.toUsername, date)
                })
              })
            }
          })
        })
      }
    }
  })
}
SpyfallConnection.prototype.eventDiscussGame = function(roomcode, message, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.discussMessage(roomcode, username, message, (err, room) => {
    if (err)
      return ack({message: err.message, status: err.status})
    ack(true)
    this.socket.to(roomcode).emit('discussed game', username, message)
  })
}
SpyfallConnection.prototype.eventOpenGame = function(roomcode, ack) {

  const username = this.getUser()
  if ( !username ) return ack({message: 'You need to login', status: 403})

  global.fn.insideRoom(roomcode, username, (err, room) => {
    if (err)
      return ack({message: err.message, status: err.status})
    this.socket.join(roomcode)
    this.socket.join(roomcode+'+'+username)

    ack(true)
  })
}
SpyfallConnection.prototype.eventJoinGame = function(roomcode, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.addToRoom(username, roomcode, (err, room) => {
    if (err) return ack({message: err.message, status: err.status})
    this.socket.to(roomcode).emit('player_joined game', username)
    ack(true)
  })
}
SpyfallConnection.prototype.eventStartGame = function(roomcode, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.closeRoom(username, roomcode, (err, room) => {
    if (err) return ack({message: err.message, status: err.status})
    this.makeRound(roomcode, ack)
    this.space.in(roomcode).emit('started game')
  })
}
SpyfallConnection.prototype.eventNewGame = function(roomcode, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.isMaster(username, roomcode, (err, yes, room) => {
    if (err) return ack({message: err.message, status: err.status})
    if (room.currentRound.number != 0)
      this.makeRound(roomcode, ack)
    else
      ack({message: 'Game has not yet started.', status: 403})
  })
}
SpyfallConnection.prototype.eventQuestionGame = function(roomcode, user, message, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.questionMessage(roomcode, username, user, message, (err, msg_new, room) => {
    if (err) return ack({message: err.message, status: err.status})

    this.socket.to(roomcode).emit('question_asked game', msg_new)
    ack(true)

    global.fn.startTimeout(roomcode, (err, date) => {
      this.space.in(roomcode).emit('take_answer game', user, date)
    })

  })
}
SpyfallConnection.prototype.eventAnswerGame = function(roomcode, answer, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.answerMessage(roomcode, username, answer, (err, msg_new, room) => {
    if (err) return ack({message: err.message, status: err.status})

    this.socket.to(roomcode).emit('answer_replied game', msg_new)

    ack(true)

    if (this.checkPhase(room, 2)) return

    global.fn.checkEnded(roomcode, (err, endedRound, game) => {
      if (err) return

      if (endedRound) {
        global.fn.roomAccuse(roomcode, (err, new_room) => {
          if (err) return
          this.checkPhase(new_room, 3)
        })
        return
      } else if (this.checkPhase(room, 3)) return

      global.fn.startTimeout(roomcode, (err, date) => {
        this.space.in(roomcode).emit('take_question game', username, date)
      })
    })
  })
}
SpyfallConnection.prototype.eventInitiateGame = function(roomcode, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.userInterrupt(roomcode, username, (err, isSpy) => {
    if (err) return ack({message: err.message, status: err.status})

    this.socket.to(roomcode).emit('initiated game', isSpy)
    ack(true)
  })
}
SpyfallConnection.prototype.eventReactGame = function(roomcode, reaction, ack) {
  const username = this.getUser()
  if ( !username ) return ack(false)

  global.fn.roomReact(roomcode, username, reaction, (err, reaction) => {
    if (err) return ack({message: err.message, status: err.status})

    this.socket.to(roomcode).emit('reacted game', username, reaction)
    ack(true)
  })
}

SpyfallConnection.prototype.eventDisconnect = function() {
  const username = this.getUser()
  const socketId = this.socket.id

  global.fn.unregisterConnection( socketId, (success) => {
    console.log(username+'@'+socketId+' has disconnected, '+success
  )
  })
}

module.exports = SpyfallConnection
