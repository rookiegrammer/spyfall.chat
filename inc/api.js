/*  Outside Game API Handler
 *  Use redirect if success
 *    If no redirect reply with JSON
 *  If fail then render error page with HTTP error status
 *
 *  We do this to allow extensibility with other client setup e.g. Java client
 */

const $ = global

$.handle.register = (req, res, webapp) => {
  const query = req.body
  $.fn.createUser(query.username, query.password, function(err, user) {

    if (err)
      return $.fn.renderError(res, err.message, err.status)

    console.log('Registered User: '+query.username)

    if (webapp) {
      res.render('success', {action: 'Registered Account', message: 'You have successfully registered with spyfall.chat'})
    } else {
      // Respond with JSON
    }
  })
}

$.handle.login = (req, res, webapp) => {
  $.fn.checkUser(req, function(err, username) {
    if (err)
      return $.fn.renderError(res, err.message, err.status)



    console.log('Logged In: '+req.session.username)

    const redirect = req.query.redirect

    if (redirect)
      res.redirect(redirect)
    else if (webapp)
      res.render('success', {action: 'Logged In', message: 'You have successfully logged in to spyfall.chat'})
    else {
      // Respond with JSON
    }
  })
}

/*
 * Add active games
 */

/*
 * Add leave game
 * - Check if no more players then also destroy room
 */

$.handle.create = (req, res, webapp) => {

  const error_handle = function(err) {
    return $.fn.renderError(res, err.message, err.status)
  }

  global.fn.checkUser(req, function(err, user) {
    if (err)
      return error_handle(err)

    global.fn.createRoom(user, function(err, code) {
      if (err)
        return error_handle(err)

      if (!req.session.rooms)
        req.session.rooms = {}

      req.session.rooms[code] = {
        master: true
        // spy: ?,
      }

      if (webapp)
        res.render('success', {action: 'Created Room', message: 'You have made a room with code <strong>'+code+'</strong>'})
      else {
        // Respond with JSON
      }
    })
  })

}

$.handle.join = (req, res, webapp) => {

  const error_handle = function(err) {
    return $.fn.renderError(res, err.message, err.status)
  }

  global.fn.checkUser(req, function(err, user) {
    if (err)
      return error_handle(err)

    global.fn.addToRoom(user, req.body.room, function(err, room) {
      if (err)
        return error_handle(err)

      // Abandoned storing rooms identifying in sessions
      // RE: It makes room handling and kicking out harder

      global.sck.game.in(req.body.room).emit('player_joined game', user)

      if (webapp)
        res.render('success', {action: 'Joined Room', message: 'You have joined the room with code <strong>'+room._id+'</strong>'})
      else {
        // Respond with JSON
      }
    })
  })

}
