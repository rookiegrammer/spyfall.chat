const app = global.app
const express = global.express

app.use(express.static('public'))

app.get('/', (req, res) => {
	res.render('index')
})

app.get('/profile/:userId', (req, res) => {
	res.send(req.params)
})

app.get('/signup', (req, res) => {
	res.render('register')
})

app.get('/messages', (req, res) => {
	res.render('message')
})

app.get('/game', (req, res) => {
	res.render('game')
})

app.get('/room/:roomId', (req, res) => {
	res.send(req.params)
	// Check if logged in..
	// Check if game started...

})

app.get('/signin', (req, res) => {
	res.render('login')
})

app.get('/open', (req, res) => {
	res.render('join')
})

app.post('/api/:command', (req, res) => {
	if (global.handle[req.params.command])
		global.handle[req.params.command](
			req,
			res,
			(req.body.webapp)?true:false
		)
	else {
		global.fn.renderError(res, 'BAD INTERFACE: '+req.params.command, 400)
	}

})
