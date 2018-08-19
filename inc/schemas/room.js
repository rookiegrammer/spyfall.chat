const mongoose = global.mongoose

const RoomSchema = new mongoose.Schema({
  _id: String,
  open: Boolean,
  chat: Boolean,
  players: [String],
  scores: {
    type: Map,
    of: Number
  },
  rounds: Number,
  messages: [{
    fromUsername: String,
    question: String,
    toUsername: String,
    answer: String
  }],
  dealer: String,
  currentRound: {
    suspicious: [String],
    guessed: Boolean
  }
})

const Room = mongoose.model('Room', RoomSchema)
