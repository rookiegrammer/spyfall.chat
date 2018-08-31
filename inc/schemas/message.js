const mongoose = global.mongoose

const MessageSchema = new mongoose.Schema({
  event: Number,
  from: String,
  to: String,
  text: String,
  date: Date
})

const Message = mongoose.model('Message', MessageSchema)
module.exports = Message

global.fn.saveMessage = function(the_event, from, to, text, date, callback) {
  if (!from)
    from = null

  var object = {
    event: the_event,
    from: from,
    to: to,
    text: text,
    date: date
  }

  Message.create(object, callback)
}

// LOAD ALL MESSAGE QUERY
// Message.aggregate(
//    [
//      { $match : { to : user } },
//      { $skip : page x limit },
//      { $limit : limit }
//      { $group : { _id : "from", messages: { $push: "$$ROOT" } } }
//    ]
// )

// LOAD MESSAGE THREAD QUERY
// Message.find( { from : sender, to : user } )

// LOAD CONTACTS
// Message.find( { to : user } ).distinct( "from" , { "from" : { $ne : null } } )
