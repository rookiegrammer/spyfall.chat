const mongoose = global.mongoose

const CorrespondentsSchema = new mongoose.Schema({
  source: String,
  destination: String,
  handshake: {
    type: Number,
    default: 0
  }
})

// Handshake Enum, 0=None, 1=Half, 2=Accepted

const Correspondents = mongoose.model('Connection', ConnectionSchema)
module.exports = Connection

global.fn.userRespondsTo = function(source, destination, callback) {
  Correspondents.findOne( {source: destination, destination: source}, function(err, correspondent) {
    if (err)
      return callback(0)
    else if (!correspondent) {
      Correspondents.create({
        source: destination,
        destination: source
      }, function(err, obj) {
        if (err) console.log(err)
      })
      return callback(0)
    }

    callback(correspondent.handshake)
  })
}

global.fn.openCorrespondence = function(source, destination, callback) {
  Correspondents.findOne( {source: source, destination: destination}, function(err, src_rspnd) {
    if (err) return callback(err)
    Correspondents.findOne( {source: destination, destination: source}, function(err, des_rspnd) {
      if (err) return callback(err)

      const des_fn = (err) => {
        if (err) return callback(err)
        if (des_rspnd) {
          if (des_rspnd.handshake < 1) {
            des_rspnd.handshake = 1
            des_rspnd.save( function (err) {
              if (err) return callback(err)
              return callback(null)
            })
          } else return callback(null)
        } else Correspondents.create({
              source: destination,
              destination: source,
              handshake: 1
            }, callback)
      }

      if (src_rspnd) {
        src_rspnd.handshake = 2
        src_rspnd.save( des_fn )
      } else {
        Correspondents.create({
          source: source,
          destination: destination,
          handshake: 2
        }, des_fn)
      }

    })
  })
}

global.fn.userRespondenceRequests(source, callback) {
  Correspondents.find( {source: source, handshake: 1}, function (err, arr_crspnd) {
    const users = [];
    if (!err)
      for (var crspnd in arr_crspnd) {
        users.push(crspnd.destination)
      }
    callback(users)
  })
}
