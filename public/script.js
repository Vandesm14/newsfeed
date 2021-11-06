const socket = io()
let stream = []
let lastFetch

socket.on('message', ({ posts }) => {
	stream = posts.map(el => encode(el.title).split(''))
	stream.unshift(encode('CQ CQ ').split(''))
	if (!lastFetch) send() // send on start of connection
	lastFetch = new Date()
})

function getDelay(char) {
	if (char === '.') return 1
	else if (char === '-' || char === ' ') return 3
	else return 0
}

const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds))

async function send() {
	let posts = []
	let current = lastFetch

	function print() {
		let reverse = [...posts].reverse()
		document.getElementById('top').innerHTML = reverse[0].split(' ').slice(-1)[0] || '&nbsp;'
		let text = reverse.map(el => el.split(' ').map(el2 => decode(el2)).join('').toUpperCase())
		document.getElementById('out').innerHTML = text.map(el => el + '<hr>').join('')
	}

	for (const i in stream) {
		posts.push('')
		const post = stream[i]
		for (let char of post) {
			if (current !== lastFetch) { // if new posts
				send()
				return
			}
			const delay = getDelay(char)
			posts[i] += char
			print()
			await sleep(delay*(1000/30))
		}
	}
}