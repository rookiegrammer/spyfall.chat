const mongoose = global.mongoose

const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  displayname: {
    type: String,
    required: false,
    default: ''
  },
  pass: {
    type: String,
    required: true,
  },
  wins: {
    type: Number,
    default: 0
  }
})

const User = mongoose.model('User', UserSchema)
module.exports = User

UserSchema.pre('save', function(next) {

  var user = this;
  global.bcrypt.hash( user.pass, 10, (err, hash) => {
      if (err) return next(err)
      user.pass = hash
      next()
  })
});

global.fn.createUser = function(username, password, callback) {
  // Check validity with regex


  // Check if user exists
  if (false)
    return callback('User already exists', null)

  var user = {}
  user._id = username
  user.pass = password

  //use schema.create to insert user into the db
  User.create(user, callback)
}

global.fn.verifyUser = (username, password, callback) => {
  // Check session
  User.findById(username, (err, user) => {

    const error = new Error('Username is not registered or may not have the correct password.')
    error.status = 401

    if (err)
      return callback(error)
    else if (!user)
      return callback(error)

    global.bcrypt.compare(password, user.pass, function (err, result) {

      if (result === true)
        return callback(null, username)
      else
        return callback(error)
    });
  });
}

global.fn.checkUser = (req, callback) => {
  const username = req.body.username

  // Check if user requested password
  if (!username && req.session && req.session.username)
    return callback(null, req.session.username)

  const password = req.body.password

  // Check validity

  const extcallback = function(err, username) {
    if (!err)
      req.session.username = username

    return callback(err, username)
  }

  global.fn.verifyUser(username, password, extcallback)
}
