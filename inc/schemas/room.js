const mongoose = global.mongoose

const RoomSchema = new mongoose.Schema({
  _id: String,
  open: {
    type: Boolean,
    default: true
  },
  chat: {
    type: Boolean,
    default: true
  },
  master: {
    type: String,
    required: true
  },
  players: {
    type: Map,
    of: {
      score: Number,
      reaction: Number
    }
  },
  deck: {
    type: String,
    default: ""
  },
  rounds: {
    type: Number,
    default: 8,
  },
  roundLength: {
    type: Number,
    default: 540,
  },
  timeoutLength: {
    type: Number,
    default: 30
  },
  currentRound: {
    spy: String,
    location: String,
    dealer: String,
    number: Number,
    willAccuse: [String],
    hasAccused: [String],
    phase: {
      type: Number,
      default: 0
    },
    spyGuessed: {
      type: Boolean,
      default: false
    },
    roles: {
      type: Map,
      of: String
    },
    messages: [{
      fromUsername: String,
      question: String,
      toUsername: String,
      answer: String
    }],
    votes: {
      type: Map,
      of: Boolean
    },
    votingFor: String,
    votedBy: String,
    victory: String,
    discussion: [{
      fromUsername: String,
      message: String
    }],
    timerStarted: {
      type: Date
    },
    timerDelta: {
      type: Number,
      default: 0,
    },
    timerPaused: {
      type: Date,
      default: null
    },
    timeoutStarted: {
      type: Date,
      default: null
    }
  }
})

const Room = mongoose.model('Room', RoomSchema)



global.fn.createRoom = function(master, callback, options) {

  const def_options = ['rounds', 'chat', 'roundLength', 'deck', 'timeoutLength']

  const code_callback = function(err, code) {

    if (err) {


      return callback(err)
    }

    var room = {
      _id: code,
      master: master,
      players: {},
      currentRound: {
        dealer: master,
        number: 0,
        discussion: []
      }
    }

    room.players[master] = {
      reaction: 0,
      score: 0
    }

    if (options)
      for (var option in def_options)
        if (options[option])
          room[option] = options[option]

    Room.create(room, function(err, room) {

      if (err && err.code == 11000)
        return global.fn.generateRoomCode(code_callback)

      // if room already exists
      callback(err, room._id)
    })
  }

  // Generate Room Code
  global.fn.generateRoomCode(code_callback)


}

global.fn.getRooms = function(user, callback) {
  Room.find({ players: user }, callback)
}

global.fn.getLastMessage = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, room, null)

    const lastindex = room.currentRound.messages.length-1
    if (room.currentRound.messages[lastindex])
      return callback(null, room.currentRound.messages[lastindex], room)

    return callback(null, null, room)
  })
}

global.fn.addToRoom = function(user, roomcode, callback) {
  Room.findById(roomcode, function(err, room) {

    if (err)
      return callback(err)

    if (!room) {
      const empty_error = new Error('Room not found.')
      empty_error.status  = 404
      return callback(empty_error, room)
    }

    if (room.open) {

      if (room.players.size >= 8) {
        const full_error = new Error('The room is already full.')
        full_error.status = 403
        return callback(full_error, room)
      }

      if (room.players.get(user))
        return callback(null, room) // User in room already

      room.players.set(user, {
        reaction: 0,
        score: 0
      })

    } else {
      const closed_error = new Error('Room is already closed.')
      closed_error.status = 403
      return callback(closed_error, room)
    }

    room.save(callback)
  })
}

global.fn.closeRoom = function(master, roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, room)

    if (room.master != master) {
      const auth_error = new Error('You do not own this room.')
      auth_error.status = 403
      return callback(auth_error, room)
    }

    if (!room.open) {
      const open_error = new Error('Room is already closed.')
      open_error.status = 403
      return callback(open_error, room)
    }

    console.log(room.players.size)

    if (room.players.size < 4) {
      const size_error = new Error('Room needs at least 4 users.')
      size_error.status = 403
      return callback(size_error, room)
    }

    room.open = false
    room.save(callback)
  })
}

global.fn.isMaster = function(master, roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, false, null)

    if (room.master != master) {
      const auth_error = new Error('You do not own this room.')
      auth_error.status = 403
      return callback(auth_error, false, null)
    }

    callback(null, true, room)
  })
}

global.fn.startRound = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, room)

    if (room.open || room.currentRound.number != 0 && room.currentRound.phase != 1) {
      const immutable_error = new Error('You can\'t do that action during this phase.')
      immutable_error.status = 403
      return callback(immutable_error, null)
    }

    if (room.currentRound.number >= room.rounds) {
      const finish_error = new Error('The game is already finished.')
      finish_error.status = 403
      return callback(finish_error, null)
    }

    const playerUsernames = global.fn.mapKeys(room.players)

    const deck = room.deck ? room.deck : global.gamedata.default

    // Get random deck
    const pileindex = global.fn.getRandomPile(deck)

    // console.log('Select pile: '+pileindex)
    // Get copy of pile
    var pile = global.gamedata.decks[deck].piles[pileindex].slice(0)

    // Choose spy
    const spyindex = global.fn.randomInt(0, playerUsernames.length-1)
    // Get spy usernames
    const spy = playerUsernames[spyindex]
    // console.log('Select spy: '+spy)

    // Create roles object
    const roles = {}

    // Iterate players for roles
    for (var i = 0; i < playerUsernames.length; i++) {
      if (i === spyindex) continue
      //
      // console.log(i)
      //
      // console.log(pile)

      // Get delta deck
      const deckSize = pile.length
      // Get username
      const user = playerUsernames[i]

      // If one role is left, assign it to user
      if (deckSize === 1) {
        roles[user] = pile[0]
        continue
      }

      // Choose random role
      const roleindex = global.fn.randomInt(0, deckSize-1)
      // Assign role to user
      roles[user] = pile[roleindex]

      // Remove role from deck copy
      pile.splice(roleindex, 1)

    }

    console.log(roles)

    // Update current round
    const current = room.currentRound
    current.dealer = current.number == 0 ? room.master : current.spy

    current.victory = null

    current.timerDelta = 0
    current.timerPaused = null

    current.spy = spy
    current.location = pileindex
    current.number += 1
    current.willAccuse = []
    current.hasAccused = []
    current.phase = 0;
    current.spyGuessed = false
    current.roles = roles
    current.messages = []
    current.votingFor = null
    current.discussion = []
    current.timerStarted = new Date()
    current.timeoutStarted = null

    if (current.votes && current.votes.clear)
      current.votes.clear()
    else
      current.votes = {}

    room.save(callback)
  })
}

global.fn.startTimeout = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, null)

    if (room.currentRound.timeoutStarted)
      return callback(null, false)

    const now = new Date()
    room.currentRound.timeoutStarted = now
    room.save(function(err) {
      if (err)
        return callback(err, null)
      callback(null, now)
    })

  })
}

global.fn.stopTimeout = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, null)

    if (!room.currentRound.timeoutStarted)
      return callback(null, false)

    room.currentRound.timeoutStarted = null
    room.save(function(err) {
      if (err)
        return callback(err, null)
      callback(null, true)
    })

  })
}

global.fn.pauseTimer = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, null)

    if (room.currentRound.timerPaused)
      return callback(null, false)

    const now = new Date()
    room.currentRound.timerPaused = now

    room.save(function(err) {
      if (err)
        return callback(err, null)
      callback(null, now)
    })
  })
}

global.fn.resumeTimer = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, null)

    if (!room.currentRound.timerPaused)
      return callback(null, false)

    room.currentRound.timerPaused = null
    const diff = new global.datediff(new Date(), room.currentRound.timerPaused)
    room.currentRound.timerDelta += diff.seconds()

    room.save(function(err) {
      if (err)
        return callback(err, null)
      callback(null, true)
    })
  })
}

global.fn.checkEnded = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, null, null, null)

    const gameEnds = room.currentRound.number >= room.rounds

    if (!room.currentRound.timerStarted)
      return callback(null, false, gameEnds, room)

    const diff = new global.datediff(new Date(), room.currentRound.timerStarted)
    callback(null, diff.seconds() - room.currentRound.timerDelta > room.roundLength, gameEnds, room)
  })
}

global.fn.questionMessage = function(roomcode, from, to, message, callback) {
  global.fn.getLastMessage(roomcode, function(err, msg_obj, room){
    if (err)
      return callback(err, msg_obj)

    if (typeof message != 'string' || message.length == 0) {
      const type_error = new Error('You need to reply with a message.')
      type_error.status = 403
      return callback(type_error, false, room)
    }

    if (room.open || room.currentRound.phase != 0) {
      const immutable_error = new Error('You can\'t do that action during this phase.')
      immutable_error.status = 403
      return callback(immutable_error, false, room)
    }

    // Here last message should be answered
    if (!msg_obj && from != room.currentRound.dealer || // Asker should be dealer if no question
      msg_obj && ( from != msg_obj.toUsername || typeof msg_obj.answer != 'string')) { // Last message should be answered and asker should have answered it
      // Not authorized error
      const auth_error = new Error('You\'re not authorized to ask.')
      auth_error.status = 403
      return callback(auth_error, false, room)
    }

    if (msg_obj && msg_obj.fromUsername == to || from == to) {
      const reject_error = new Error('You shouldn\'t ask back to the person who just asked you.')
      reject_error.status = 403
      return callback(reject_error, false, room)
    }

    if (!room.players.get(to)) {
      const find_error = new Error('Player in room not found.')
      find_error.status = 404
      return callback(find_error, false, room)
    }

    const msg_new = {
      fromUsername: from,
      question: message,
      toUsername: to
    }

    room.currentRound.timeoutStarted = null
    room.currentRound.messages.push(msg_new)

    room.save(function(err, new_room) {
      callback(err, msg_new, new_room)
    })
  })
}

global.fn.answerMessage = function(roomcode, user, answer, callback) {
  global.fn.getLastMessage(roomcode, function(err, msg_obj, room){
    if (err)
      return callback(err, msg_obj)

    if (typeof answer != 'string' || answer.length == 0) {
      const type_error = new Error('You need to reply with an answer.')
      type_error.status = 403
      return callback(type_error, false, room)
    }

    if (room.open || room.currentRound.phase != 0) {
      const immutable_error = new Error('You can\'t do that action during this phase.')
      immutable_error.status = 403
      return callback(immutable_error, false)
    }

    if (!msg_obj
      || msg_obj && (user != msg_obj.toUsername || typeof msg_obj.answer == 'string') ) { // Should not be answered yet and user should answer
      // Not authorized error
      const auth_error = new Error('You\'re not authorized to answer.')
      auth_error.status = 403
      return callback(auth_error, {}, room)
    }

    room.currentRound.timeoutStarted = null
    msg_obj.answer = answer

    room.save(function(err, new_room) {
      callback(err, msg_obj, new_room)
    })
  })
}

global.fn.discussMessage = function(roomcode, user, answer, callback) {
  Room.findById(roomcode, function(err, room){
    if (err)
      return callback(err, null)

    if (typeof answer != 'string' || answer.length == 0) {
      const type_error = new Error('You need to have a message.')
      type_error.status = 403
      return callback(type_error, false, room)
    }

    if (!room.open && room.currentRound.phase != 4 && room.currentRound.phase != 1) {
      const immutable_error = new Error('You can\'t do that action during this phase.')
      immutable_error.status = 403
      return callback(immutable_error, false)
    }

    if (!room.players.get(user)) {
      const find_error = new Error('Player in room not found.')
      find_error.status = 404
      return callback(find_error, false, room)
    }

    if (!room.currentRound.discussion)
      room.currentRound.discussion = []

    room.currentRound.discussion.push({
      fromUsername: user,
      message: answer
    })

    room.save(callback)
  })
}

global.fn.processInterrupts = function(roomcode, beforeSave, callback) {
  Room.findById(roomcode, function(err, room) {

    beforeSave(err, room.deck, room.currentRound)

    room.save(callback)
  })
}

global.fn.roomReact = function(roomcode, username, reaction, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, room)

    var ack = false

    const player = room.players.get(username)

    if (!player) {
      const find_error = new Error('Player in room not found.')
      find_error.status = 404
      return callback(find_error, reaction)
    }

    player.reaction = reaction

    room.players.set(username, player)

    room.save(function(err, new_room) {
      callback(null, reaction)
    })
  })
}

// Should have cancel Interrupt
global.fn.userInterrupt = function(roomcode, username, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, false)

    const isSpy = room.currentRound.spy == username

    if (room.open || room.currentRound.phase != 0) {
      const immutable_error = new Error('You can\'t do that action during this phase.')
      immutable_error.status = 403
      return callback(immutable_error, false)
    }

    if (isSpy) {
      if (room.currentRound.spyGuessed) {
        const done_error = new Error('Player has already initiated.')
        done_error.status = 403
        return callback(done_error, false)
      }

      room.currentRound.spyGuessed = true
    } else {
      // Check if user in room
      const player = room.players.get(username)

      if (!player) {
        const find_error = new Error('Player in room not found.')
        find_error.status = 404
        return callback(find_error, reaction)
      }

      if (!room.currentRound.suspected)
        room.currentRound.suspected = []

      const hasAccused = room.currentRound.hasAccused
      const willAccuse = room.currentRound.willAccuse

      if (hasAccused.indexOf(username) >= 0) {
        const done_error = new Error('Player has already done this action in the round.')
        done_error.status = 403
        return callback(done_error, false)
      }

      if (willAccuse.indexOf(username) >= 0) {
        const done_error = new Error('Player has already initiated.')
        done_error.status = 403
        return callback(done_error, false)
      }

      room.currentRound.willAccuse.push(username)
    }

    room.save(function(err, new_room) {
      callback(err, isSpy)
    })
  })
}

global.fn.insideRoom = function(roomcode, username, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, null)
    if (!room || !room.players) {
      const find_error = new Error('Room not found.')
      find_error.status = 404
      return callback(find_error, null)
    }


    const player = room.players.get(username)

    if (!player) {
      const find_error = new Error('Player in room not found.')
      find_error.status = 404
      return callback(find_error, null)
    }

    callback(null, room)
  })
}

global.fn.connectRoom = function(roomcode, username, callback) {

  global.fn.insideRoom(roomcode, username, function(err, room) {
    if (err)
      return callback(err, null)

    const isMaster = (username == room.master)

    const isSpy = (username == room.currentRound.spy)
    const role = isSpy ? 'spy' : (room.currentRound.roles ? room.currentRound.roles.get(username) : '')
    const location = isSpy ? null : room.currentRound.location

    var message = null

    const lastindex = room.currentRound.messages.length-1
    if (room.currentRound.messages[lastindex])
      message = room.currentRound.messages[lastindex]

    const newQuestion = !message || message && typeof message.answer == 'string'
    const needInput = message ? message.toUsername : room.currentRound.dealer

    var initiated = false

    var endgame = null
    if (room.currentRound.phase == 1) {
      endgame = {
        spy: room.currentRound.spy,
        location: room.currentRound.location,
        roles: global.fn.mapToObject(room.currentRound.roles)
      }
    }

    if (isSpy)
      initiated = room.currentRound.spyGuessed
    else {
      const willAccuse = room.currentRound.willAccuse
      initiated = willAccuse.indexOf(username) >= 0
    }

    const deck = room.deck ? room.deck : global.gamedata.default
    const piles = global.gamedata.decks[deck].piles

    const stateObject = {
      asked: !newQuestion,
      deck: room.deck,
      discussion: room.currentRound.discussion,
      game: {
        role: role,
        location: location,
        endgame: endgame
      },
      hasAccused: room.currentRound.hasAccused,
      initiated: initiated,
      input: needInput,
      locations: Object.keys(piles),
      master: isMaster,
      messages: room.currentRound.messages,
      number: room.currentRound.number,
      open: room.open,
      phase: room.currentRound.phase,
      roundLength: room.roundLength,
      rounds: room.rounds,
      spyGuessed: room.currentRound.spyGuessed,
      timerDelta: room.currentRound.timerDelta,
      timerStarted: room.currentRound.timerStarted,
      timeoutLength: room.timeoutLength,
      timeoutStarted: room.currentRound.timerStarted,
      username: username,
      victory: room.currentRound.victory,
      votedBy: room.currentRound.votedBy,
      votes: room.currentRound.votes ? global.fn.mapToObject(room.currentRound.votes) : {},
      votingFor: room.currentRound.votingFor
    }

    const players = global.fn.mapKeys(room.players)
    global.fn.groupConnection(players, (states) => {
      const playersObject = {}

      for (const player of players)
        playersObject[player] = Object.assign( { connected: states[player] }, room.players.get(player) )

      stateObject.players = playersObject

      callback(null, stateObject)
    })
  })
}

global.fn.voteRoom = function (roomcode, username, guess, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, null)

    const round = room.currentRound

    if (room.open || room.currentRound.phase != 3 || !round.willAccuse || round.willAccuse[0] != username) {
      const immutable_error = new Error('You can\'t do that action during this phase.')
      immutable_error.status = 403
      return callback(immutable_error, null)
    }

    if (username == guess || !room.players.get(guess) ) {
      const unvote_error = new Error('You cannot vote for this person.')
      unvote_error.status = 403
      return callback(unvote_error, null)
    }

    room.currentRound.votingFor = guess
    room.currentRound.votes.clear()
    room.currentRound.votedBy = username

    room.save(callback)
  })
}

global.fn.checkGuess = function(roomcode, username, guess, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, null)

    if (room.open || room.currentRound.phase != 2 || room.currentRound.spy != username) {
      const immutable_error = new Error('You can\'t do that action during this phase.')
      immutable_error.status = 403
      return callback(immutable_error, null)
    }

    callback(null, room.currentRound.location.toLowerCase() == guess.toLowerCase(), room)
  })
}

global.fn.setCheckVote = function(roomcode, username, vote, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, null)

    if (room.open || room.currentRound.phase != 4) {
      const immutable_error = new Error('You can\'t do that action during this phase.')
      immutable_error.status = 403
      return callback(immutable_error, null)
    }

    if ( !room.players.get(username) ) {
      const find_error = new Error('Player in room not found.')
      find_error.status = 404
      return callback(find_error, null)
    }

    if ( room.currentRound.votingFor == username ) {
      const nope_error = new Error('You cannot vote.')
      nope_error.status = 403
      return callback(nope_error, null)
    }

    if ( room.currentRound.votedBy == username || room.currentRound.votes.get(username) ) {
      const done_error = new Error('You did already vote.')
      done_error.status = 403
      return callback(done_error, null)
    }

    room.currentRound.votes.set(username, vote)

    room.save(function(err, new_room) {
      if (err)
        return callback(err, null)

      var allvoted = true
      var playersTrue = 1
      const playerSize = new_room.players.size - 1

      for ( const player of new_room.players.keys() ) {
        if ( player != new_room.currentRound.votedBy && player != new_room.currentRound.votingFor ) {
          if ( new_room.currentRound.votes.has(player) ) {
            if ( new_room.currentRound.votes.get(player) ) playersTrue++
          } else
            allvoted = false
        }
      }

      const consensus = (playersTrue/playerSize) > global.config.consensus_percent
      callback(null, allvoted, consensus, new_room.currentRound.spy == new_room.currentRound.votingFor, new_room)
    })
  })
}

global.fn.roomScoring = function(roomcode, scoring, callback) {
  Room.findById(roomcode, function(err, room) {
    // Check scoring section
    const spyUser = room.currentRound.spy
    if (scoring == 0 || scoring == 1 || scoring == 4 ) {
      // Spy win
      var points = 2
      if (scoring == 1 || scoring == 4)
        points += 2

      const spy = room.players.get(spyUser)
      spy.score += points
      room.players.set(spyUser, spy)
    } else {
      const accuser = room.currentRound.votedBy
      var points = 1

      const playerKeys = global.fn.mapKeys(room.players)
      for (var i = 0; i < playerKeys.length; i++) {
        const player = playerKeys[i]
        if (player != spyUser) {
          const obj = room.players.get(player)
          obj.score += 1

          if (scoring == 3 && player == accuser)
            obj.score += 1

          room.players.set(player, obj)
        }
      }
    }
    room.save(callback)
  })
}

global.fn.roomAccuse = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    room.currentRound.hasAccused = []
    room.currentRound.willAccuse = global.fn.mapKeys(room.players)

    room.save(callback)
  })
}

global.fn.announceDisconnect = function(user, callback) {
  const prop = "players."+user
  const query = {}
  query[prop] = { "$exists": true }
  Room.find(query, function(err, docs) {
    if (err) {
      console.log(err)
      callback(false)
    }

    for (const room of docs)
      global.sck.game.in(room._id).emit('user_disconnected game', user)

    callback(true)
  })
}

global.fn.announceConnect = function(user, callback) {
  const prop = "players."+user
  const query = {}
  query[prop] = { "$exists": true }
  Room.find(query, function(err, docs) {
    if (err) {
      console.log(err)
      callback(false)
    }



    for (const room of docs) {
      global.sck.game.in(room._id).emit('user_connected game', user)
    }

    callback(true)
  })
}

// Testing functions
//
// global.fn.startRound('5c822e64', function(err){
//   if (!err) console.log('Success')
// })


// global.fn.getRooms('nani', function(err, rooms) {
//   console.log(rooms);
// })
