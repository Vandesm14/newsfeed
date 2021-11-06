const { encode, decode } = require('morsee')
const { Server } = require('socket.io')
const Parser = require('rss-parser')
const express = require('express')
const axios = require('axios')
const http = require('http')

const app = express()
app.set('port', process.env.PORT || 3000)
app.use(express.static('public'))
const server = http.createServer(app)
const io = new Server(server)
const parser = new Parser()

let posts = []
let lastFetch

function toUTC(date) {
	const d = new Date(date*1000)
	const day = d.getUTCDate()
	const month = d.toLocaleString('en-us', { month: 'short' })
	const year = d.getUTCFullYear()
	const h = String(d.getUTCHours()).padStart(2, '0')
	const m = String(d.getUTCMinutes()).padStart(2, '0')
	return `${month} ${day} ${h}:${m}T`
}

async function getPosts() {
	let res = await axios.get('https://www.reddit.com/r/technews/new.json')
	const reddit = res.data.data.children
	posts = reddit.map(el => ({
		title: el.data.title,
		created: el.data.created,
		url: el.data.url,
		source: 'RDDT'
	}))

	const hn = await parser.parseURL('https://news.ycombinator.com/rss')

	posts.concat(hn.items.map(el => ({
		title: el.title,
		url: el.link,
		created: (new Date(el.isoDate)).getTime(),
		source: 'HN'
	})))

	posts.sort((a, b) => b.created - a.created)
	posts = posts.map(el => (encode(el.source + ' ' + toUTC(el.created) + ' - ' + el.title) + ' / -...- / ').split(''))
	posts.unshift(('-.-.- -...- / ').split(''))
	if (!lastFetch) send()
	lastFetch = Date.now()
}

function getDelay(char) {
	if (char === '.') return 1 // dot
	else if (char === '-' || char === ' ') return 3 // dash or space
	else if (char === '/') return 7 // between words
	else return 0 // unknown
}

const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds))

async function send() {
	const current = lastFetch
	'   '.split('').map(el => io.emit('message', el)) // clear screen

	for (const i in posts) {
		const post = posts[i]
		for (let char of post) {
			if (lastFetch !== current) {
				send()
				return
			}
			const wpm = 30
			const dits = (60 / (50 * wpm)) * 1000
			const delay = getDelay(char)
			io.emit('message', char)
			await sleep(delay*dits) // hold tone
			await sleep(dits) // space between tones
		}
	}
}

io.sockets.on('connection', function (socket) {})
server.listen(app.get('port'), () => {
	console.log('listening on port ' + app.get('port'))
	setInterval(getPosts, 1000*60*15) // fetch every 15 minutes
	getPosts()
})