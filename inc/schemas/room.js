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
  players: [{
    username: String,
    score: Number,
    reaction: Number
  }],
  deck: {
    type: String,
    default: "default"
  },
  rounds: {
    type: Number,
    default: 8,
  },
  roundLength: {
    type: Number,
    default: 540,
  },
  messages: [{
    fromUsername: String,
    question: String,
    toUsername: String,
    answer: String
  }],
  discussion: [{
    fromUsername: String,
    message: String
  }],
  currentRound: {
    spy: String,
    location: String,
    dealer: String,
    number: Number,
    suspicious: [String],
    suspected: [String],
    voting: {
      type: Boolean,
      default: false
    },
    guessed: {
      type: Boolean,
      default: false
    },
    roles: {
      type: Map,
      of: String
    },
    timerStarted: {
      type: Date
    },
  }
})

const Room = mongoose.model('Room', RoomSchema)



global.fn.createRoom = function(master, callback, options) {

  const def_options = ['rounds', 'chat', 'roundLength', 'deck']

  const code_callback = function(err, code) {

    if (err) {


      return callback(err)
    }

    var room = {
      _id: code,
      master: master,
      players: [{
        username: master,
        reaction: 0,
        score: 0
      }],
      currentRound: {
        dealer: master,
        number: 0
      }
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
  Room.find({ players: {$elemMatch: {username: user} } }, callback)
}

global.fn.getLastMessage = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, room, null)

    const lastindex = room.messages.length-1
    if (room.messages[lastindex])
      return callback(null, room.messages[lastindex], room)

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
      if (room.players.length >= 8) {
        const full_error = new Error('The room is already full.')
        full_error.status = 403
        return callback(full_error, room)
      }

      for (var i = 0; i < room.players.length; i++) {
        if (room.players[i].username == user)
          return callback(null, room) // User in room already
      }

      room.players.push({
        username: user,
        reaction: 0,
        score: 0
      })

      if (room.players.length >= 8)
        room.open = false

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

    if (room.players.length < 4) {
      const size_error = new Error('Room needs at least 4 users.')
      size_error.status = 403
      return callback(size_error, room)
    }

    room.open = false
    room.save(callback)
  })
}

global.fn.startRound = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, room)

    // if (room.open) {
    //   // Room still open
    //   return callback(err, room)
    // }

    const players = room.players

    const deck = room.deck

    // Get random deck
    const pileindex = global.fn.getRandomPile(deck)

    // console.log('Select pile: '+pileindex)
    // Get copy of pile
    var pile = global.gamedata.decks[deck].piles[pileindex].slice(0)

    // Choose spy
    const spyindex = global.fn.randomInt(0,room.players.length-1)
    // Get spy username
    const spy = room.players[spyindex].username
    // console.log('Select spy: '+spy)

    // Create roles object
    const roles = {}

    // Iterate players for roles
    for (var i = 0; i < players.length; i++) {
      if (i === spyindex) continue

      console.log(pile)

      // Get delta deck
      const deckSize = pile.length
      // Get username
      const user = players[i].username

      // If one role is left, assign it to user
      if (deckSize === 1) {
        roles[user] = pile[0]
        continue
      }

      // Choose random role
      const roleindex = global.fn.randomInt(0, deck.length-1)
      // Assign role to user
      roles[user] = pile[roleindex]

      // Remove role from deck copy
      pile.splice(roleindex, 1)

    }

    room.messages = []

    // Update current round
    const current = room.currentRound
    current.location = pileindex
    current.roles = roles
    current.dealer = current.number == 0 ? room.master : current.spy
    current.spy = spy
    current.timerStarted = Date.now()
    current.guessed = false
    current.suspicious = []
    current.number += 1

    room.save(callback)
  })
}

global.fn.checkEnded = function(roomcode, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, room)

    const gameEnds = room.rounds >= room.currentRound.number

    if (!room.currentRound.timerStarted)
      return callback(null, false, gameEnds)

    const diff = new global.datediff(Date.now(), room.currentRound.timerStarted)
    callback(null, room.currentRound.guessed|| diff.seconds() > room.roundLength, gameEnds)
  })
}

global.fn.questionMessage = function(roomcode, from, to, message, callback) {
  global.fn.getLastMessage(roomcode, function(err, msg_obj, room){
    if (err)
      return callback(err, msg_obj)

    // Here last message should be answered
    if (!msg_obj && from != room.currentRound.dealer || // Asker should be dealer if no question
      msg_obj && ( typeof msg_obj.answer != 'string' || from != msg_obj.toUsername)) { // Last message should be answered and asker should have answered it
      // Not authorized error
      const auth_error = new Error('You\'re not authorized to ask.')
      auth_error.status = 403
      return callback(auth_error, room)
    }

    const msg_new = {
      fromUsername: from,
      question: message,
      toUsername: to
    }

    room.messages.push(msg_new)

    room.save(function(err, new_room) {
      callback(err, msg_new)
    })
  })
}

global.fn.answerMessage = function(roomcode, user, answer, callback) {
  global.fn.getLastMessage(roomcode, function(err, msg_obj, room){
    if (err)
      return callback(err, msg_obj)

    if (!msg_obj
      || msg_obj && (typeof msg_obj.answer == 'string' || user != msg_obj.toUsername) ) { // Should not be answered yet and user should answer
      // Not authorized error
      const auth_error = new Error('You\'re not authorized to answer.')
      auth_error.status = 403
      return callback(auth_error, room)
    }

    msg_obj.answer = answer

    room.save(function(err, new_room) {
      callback(err, msg_obj)
    })
  })
}

global.fn.roomReact = function(roomcode, username, reaction, callback) {
  Room.findById(roomcode, function(err, room) {
    if (err)
      return callback(err, room)

    var ack = false

    for (var i=0; i<room.players.length; i++) {
      if (username == room.players[i].username) {
        room.players[i].reaction = reaction
        ack = true
      }
    }

    if (!ack) {
      const find_error = new Error('Player in room not found.')
      find_error.status = 404
      return callback(find_error, reaction)
    }

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

    if (room.currentRound.spy == username) {
      room.currentRound.guessed = true
    } else {
      // Check if user in room
      var ack = false

      for (var i=0; i<room.players.length; i++)
        if (username == room.players[i].username)
          ack = true

      if (!ack) {
        const find_error = new Error('Player in room not found.')
        find_error.status = 404
        return callback(find_error, reaction)
      }

      if (!room.currentRound.suspected)
        room.currentRound.suspected = []

      const suspected = room.currentRound.suspected

      if (suspected.indexOf(username) >= 0)
        return callback(null, false)

      room.currentRound.suspicious.push(username)
    }

    room.save(function(err, new_room) {
      callback(err, true)
    })
  })
}

global.fn.insideRoom = function(roomcode, username, callback) {
  Room.findById(roomcode, function(err, room) {
    var ack = false

    for (var i=0; i<room.players.length; i++) {
      if (username == room.players[i].username)
        ack = true
    }

    if (!ack) {
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
    const role = isSpy ? 'spy' : room.currentRound.roles.get(username)
    const location = isSpy ? null : room.currentRound.location

    var message = null

    const lastindex = room.messages.length-1
    if (room.messages[lastindex])
      message = room.messages[lastindex]

    const newQuestion = !message || message && typeof message.answer == 'string'
    const needInput = message ? ( message.toUsername == username ) : room.currentRound.dealer == username

    const stateObject = {
      input: needInput,
      asked: !newQuestion,
      game: {
        role: role,
        location: location
      },
      open: room.open,
      number: room.currentRound.number,
      rounds: room.rounds,
      username: username,
      roundLength: room.roundLength,
      timerStarted: room.currentRound.timerStarted,
      players: room.players,
      messages: room.messages,
      guessed: room.currentRound.guessed,
      master: isMaster,
      suspicious: room.currentRound.suspicious,
      deck: room.deck
    }

    callback(null, stateObject)
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
