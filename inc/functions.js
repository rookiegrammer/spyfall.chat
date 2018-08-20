
const $ = global

var prev = true

$.fn.renderError = (res, error, status) => {
  if (!status)
    status = 400

  res.status(status)
  res.render('error', {error: error, status: status})
}

$.fn.generateRoomCode = (callback) => {

  // TESTER FOR REGENERATE NEW CODE IF EXISTS
  // if (prev){
  //   prev = false
  //   return callback(null, '56d7a57a')
  // } else
  //   return callback(null, '56d7a57a2')

  // Asynchronous
  const code = global.crypto.randomBytes(4, (err, buffer) => {
    if (err)
      return callback(err)
    return callback(null, buffer.toString('hex'))
  });
}
