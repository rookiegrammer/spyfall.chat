
const $ = global

var prev = true

const bytesize = 2
const maxint = Math.pow(2, bytesize*8)-1

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
  global.crypto.randomBytes(bytesize, (err, buffer) => {
    if (err)
      return callback(err)
    return callback(null, parseInt(buffer.toString('hex'), 16));
  });
}

$.fn.randomFlt = () => {
  const rndbytes = global.crypto.randomBytes(bytesize)
  return global.intformat(rndbytes, 'dec')/maxint
}

$.fn.randomInt = (min, max) => {
  return Math.round((max-min)*($.fn.randomFlt()))+min
}

$.fn.getRandomPile = (deck) => {
  if (!deck)
    deck = global.gamedata.default

  const piles = global.gamedata.decks[deck].piles

  if (!piles)
    return null

  const pilesKeys = Object.keys(piles)
  const pilesLength = pilesKeys.length
  const index = global.fn.randomInt(0, pilesLength-1)

  return pilesKeys[index]
}

$.fn.mapToObject = (mmap) => {
  const obj = {};

  for (const key of mmap.keys()) {
    obj[key] = mmap.get(key)
  }

  return obj
}

$.fn.mapKeys = (mmap) => {
  const arr = []

  for (const key of mmap.keys()) {
    arr.push(key)
  }

  return arr
}
