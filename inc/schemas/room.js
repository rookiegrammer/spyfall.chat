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
  players: [String],
  scores: {
    type: Map,
    of: Number
  },
  rounds: {
    type: Number,
    default: 8,
  },
  messages: [{
    fromUsername: String,
    question: String,
    toUsername: String,
    answer: String
  }],
  currentRound: {
    spy: String,
    location: String,
    dealer: String,
    number: Number,
    suspicious: [String],
    guessed: {
      type: Boolean,
      default: false
    },
    roles: {
      type: Map,
      of: String
    }
  }
})

const Room = mongoose.model('Room', RoomSchema)

global.fn.createRoom = function(master, callback, options) {

  const def_options = ['rounds', 'chat']

  const code_callback = function(err, code) {

    if (err) {


      return callback(err)
    }

    var room = {
      _id: code,
      master: master,
      players: [master],
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

global.fn.addToRoom = function(user, room, callback) {
  Room.findById(room, function(err, room) {


    if (err)
      return callback(err)

    if (!room) {
      const empty_error = new Error('Room not found.')
      empty_error.status  = 404
      return callback(empty_error, room)
    }

    if (room.open) {
      if (room.players.indexOf(user) == -1) // Check if already there
        room.players.push(user)
      else {
        const joined_error = new Error('User already in room.')
        joined_error.status = 400
        return callback(joined_error, room)
      }
    } else {
      const closed_error = new Error('Room is already closed because it is in session.')
      closed_error.status = 403
      return callback(closed_error, room)
    }

    room.save(function (err, newroom){
      callback(err, newroom)
    })
  })
}
