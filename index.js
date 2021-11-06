const { encode, decode } = require('morsee')
const { Server } = require('socket.io')
const express = require('express')
const axios = require('axios')
const http = require('http')

const app = express()
app.set('port', process.env.PORT || 3000)
app.use(express.static('public'))
const server = http.createServer(app)
const io = new Server(server)

let posts = []

async function getPosts() {
	const res = await axios.get('https://www.reddit.com/r/technews/new.json')
	const json = res.data.data.children
	posts = json.map(el => ({
		title: el.data.title,
		created: el.data.created,
		url: el.data.url
	}))
	posts.sort((a, b) => b.created - a.created)
	io.emit('message', { posts })
}

setInterval(getPosts, 1000*60*15)
getPosts()

io.sockets.on('connection', function (socket) {
	socket.emit('message', { posts })
})

server.listen(app.get('port'), () => {
	console.log('listening on port ' + app.get('port'))
})