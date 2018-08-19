
const $ = global

$.fn.renderError = (res, error, status) => {
  if (!status)
    status = 400

  res.status(status)
  res.render('error', {error: error, status: status})
}

$.fn.generateRoomCode = (callback) => {
  // Asynchronous
  const code = global.crypto.randomBytes(48, (err, buffer) => {
    var token = buffer.toString('hex');
  });
}
