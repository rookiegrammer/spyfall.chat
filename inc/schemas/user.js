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
  global.bcrypt.hash( user.pass, 10, function(err, hash) {
      if (err) return next(err)
      user.pass = hash
      next()
  })
});

global.fn.createUser = function(req, username, password, callback) {
  // Check validity with regex


  var user = {}
  user._id = username
  user.pass = password

  User.create(user, function(err, user) {
    if (err && err.code == 11000) {
      const exists_error = new Error('User already exists.')
      exists_error.status = 409
      return callback(exists_error, user)
    }
    req.session.username = username
    callback(err, user)
  })
}

global.fn.hasUser = function(username, callback) {
  User.findById(username, function(err, user) {
    if (err || !user)
      return callback(false)
    callback(true)
  })
}

global.fn.verifyUser = function(username, password, callback) {
  // Check session
  User.findById(username, function(err, user) {

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

// Login or verify
global.fn.checkUser = function(req, callback) {
  const username = req.body.username

  // Check if user has session and is not logging in
  if (!username && req.session && req.session.username)
    return callback(null, req.session.username)

  const password = req.body.password

  // User didn't provide credentials
  if (!password && !username) {
    const error = new Error('User is not logged in.')
    error.status = 400
    return callback(error, null)
  }

  global.fn.verifyUser(username, password, function(err, username) {
    if (err)
      return callback(err, null)

    req.session.username = username
    return callback(null, username)
  })
}

global.fn.userExists = function(user, callback) {
  User.countDocuments({_id: user}, function(err, count) {
    callback(err, count > 0)
  })
}
