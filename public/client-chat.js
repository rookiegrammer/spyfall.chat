var chatFn = {}

$(function(){
  message = io.connect('http://localhost:9000/chat')

  chatFn.sendMessage = function(user, text) {
    message.emit('send message', user, text)
  }

  chatFn.openMessage = function() {
    message.emit('open message')
  }

  message.on('receive message', (object) => {
    $('#messages').append('From '+object.from+': '+object.message+'<br>')
  } )

  message.on('store message', (object) => {
    $('#messages').append('To '+object.to+': '+object.message+'<br>')
  } )
})
