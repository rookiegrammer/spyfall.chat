const mongoose = global.mongoose

const ConnectionSchema = new mongoose.Schema({
  _id: String,
  username: String,
  connected: Date
})

const Connection = mongoose.model('Connection', ConnectionSchema)
module.exports = Connection

global.fn.registerConnection = function(socket, user, callback) {
  global.fn.hasUser(user, function(exists){
    if (!exists) return callback(false)
    global.fn.hasConnection(user, (connected) => {
      Connection.create({
        _id: socket,
        username: user,
        connected: new Date()
      }, function(err, connection) {
        if (err)
          return callback(false)
        callback(true)

        if (!connected)
          global.fn.announceConnect(user, (success) => {
            console.log('User '+user+' has announced connect: '+success)
          })
      })
    } )


  })
}

global.fn.hasConnection = function(user, callback) {
  Connection.findOne({ username: user }, function (err, conn) {
    if (err)
      return callback(false)
    callback( conn != null )
  });
}

global.fn.groupConnection = function(users, callback) {
  const userlist = users.slice(0)
  const states = {}

  const reiterate = function() {
    if (userlist.length > 0) {
      const user = userlist.pop()
      global.fn.hasConnection(user, (connected) => {
        states[user] = connected
        reiterate()
      })
    } else callback(states)
  }
  reiterate()
}

global.fn.unregisterConnection = function(socket, callback) {
  Connection.findByIdAndDelete(socket, function(err, conn) {
    if (err || !conn)
      return callback(false)
    callback(true)

    const username = conn.username

    if (username) {
      global.fn.hasConnection(username, (connected) => {
        if (!connected)
          global.fn.announceDisconnect(username, (success) => {
            console.log('User '+username+' has announced disconnect: '+success)
          })
      } )
    }
  })
}
