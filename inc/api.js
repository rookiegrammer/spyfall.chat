/*  Outside Game API Handler
 *  Use redirect if success
 *    If no redirect reply with JSON
 *  If fail then render error page with HTTP error status
 *
 *  We do this to allow extensibility with other client setup e.g. Java client
 */

const $ = global

$.handle.register = (req, res, redirect) => {
  const query = req.body
  const callback = (err, user) => {

    if (err)
      return $.fn.renderError(res, err.message, err.status)

    console.log('Registered User: '+query.username)

    if (redirect)
      res.redirect(redirect)
    else {
      // Respond with JSON
    }
  }
  $.fn.createUser(query.username, query.password, callback)
}

$.handle.login = (req, res, redirect) => {
  const callback = (err, username) => {
    if (err)
      return $.fn.renderError(res, err.message, err.status)

    console.log('Logged In: '+username)

    // Store in session variable
    if ( !req.session.username )
      req.session.username = username

    if (redirect)
      res.redirect(redirect)
    else {
      // Respond with JSON
    }
  }
  $.fn.checkUser(req, callback)
}
