const { encode, decode } = require('morsee')
const { Server } = require('socket.io')
const Parser = require('rss-parser')
const express = require('express')
const http = require('http')

const app = express()
app.set('port', process.env.PORT || 3000)
app.use(express.static('public'))
const server = http.createServer(app)
const io = new Server(server)
const parser = new Parser()

let posts = []
let feed = []
let lastFetch

function toUTC(date) {
	const d = new Date(date*1000)
	const day = String(d.getUTCDate()).padStart(2, '0')
	const month = String(d.getUTCMonth() + 1).padStart(2, '0')
	const h = String(d.getUTCHours()).padStart(2, '0')
	const m = String(d.getUTCMinutes()).padStart(2, '0')
	return `${month}-${day} ${h}:${m}T`
}

function rssToDate(date) {
	return ((new Date(date)).getTime() / 1000).toFixed(0)
}

async function getPosts() {
	let reddit = await parser.parseURL('https://www.reddit.com/r/technews/new.rss')
	reddit = reddit.items.map(el => ({
		title: el.title,
		url: el.content.match(/href="(.*?)"/g)[2].slice(6,-1) || '',
		created: rssToDate(el.isoDate),
		source: 'RDDT'
	}))

	let hn = await parser.parseURL('https://news.ycombinator.com/rss')
	hn = hn.items.map(el => ({
		title: el.title,
		url: el.link,
		created: rssToDate(el.isoDate),
		source: 'HKRN'
	}))
	.filter(el => el.title.split(' ').length > 3)

	let cnet = await parser.parseURL('https://www.cnet.com/rss/news/')
	cnet = cnet.items.filter(el => el.link.includes('tech'))
	.map(el => ({
		title: el.title,
		url: el.link,
		created: rssToDate(el.isoDate),
		source: 'CNET'
	}))

	let verge = await parser.parseURL('https://www.theverge.com/tech/rss/index.xml')
	verge = verge.items
	.map(el => ({
		title: el.title,
		url: el.link,
		created: rssToDate(el.isoDate),
		source: 'TVRG'
	}))

	posts = [
		...reddit.slice(0, 15),
		...hn.slice(0, 15),
		...cnet.slice(0, 15),
		...verge.slice(0, 15)
	]
	posts.sort((a, b) => b.created - a.created)
	feed = [...posts]

	posts = posts.map(el => (encode(el.source + ' ' + toUTC(el.created) + ' - ' + el.title) + ' / -...- / ').split(''))
	posts.unshift(('         / -.-.- -...- / ').split(''))
	if (!lastFetch) send()
	lastFetch = Date.now()
	io.emit('links', feed)
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
			await sleep(delay*dits + dits) // hold tone
		}
	}

	send()
	return
}

io.sockets.on('connection', function (socket) {
	socket.emit('links', feed)
})
server.listen(app.get('port'), () => {
	console.log('listening on port ' + app.get('port'))
	setInterval(getPosts, 1000*60*15) // fetch every 15 minutes
	getPosts()
})