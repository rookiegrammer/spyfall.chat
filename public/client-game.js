var gameFn = {}

$(function(){
  const game = io.connect(window.location.origin+'/game')
  const game_priv = io.connect(window.location.origin+'/game_priv')

  gameFn.startGame = function() {

    game.emit('start game', room)
  }

  gameFn.openMessage = function() {
    const user = $('#username').val()

    game.emit('open message', user)
  }

  game.on('receive message', (object) => {
    $('#messages').append('From '+object.from+': '+object.message+'<br>')
  } )

  game.on('store message', (object) => {
    $('#messages').append('To '+object.to+': '+object.message+'<br>')
  } )
})
