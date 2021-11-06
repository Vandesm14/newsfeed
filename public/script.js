const socket = io()
let stream = []
let lastFetch

socket.on('message', ({ posts }) => {
	stream = posts.map(el => (encode(el.title) + ' / -...-').split(''))
	stream.unshift(('-.-. --.- / -.-. --.- / -.-.- -...-').split(''))
	if (!lastFetch) send() // send on start of connection
	lastFetch = new Date()
})

function getDelay(char) {
	if (char === '.') return 1 // dot
	else if (char === '-' || char === ' ') return 3 // dash or space
	else if (char === '/') return 7 // between words
	else return 0 // unknown
}

const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds))

async function send() {
	let posts = []
	let current = lastFetch

	function print() {
		let reverse = [...posts].reverse()
		const char = reverse[0].split(' ').slice(-1)[0] || '&nbsp'
		document.getElementById('top').innerHTML = decode(char).toUpperCase() + ' ' + char

		let text = reverse.map(el => el.split(' ').map(el2 => decode(el2)).join('').toUpperCase())
		document.getElementById('out').innerHTML = text.map(el => el + '<hr>').join('')
	}

	for (const i in stream) {
		posts.push('')
		const post = stream[i]
		for (let char of post) {
			const ac = new AudioContext()
			const osc = ac.createOscillator()
			const gain = ac.createGain()

			function play() {
				osc.type = 'sine'
				osc.frequency.value = 440
				gain.gain.value = 1
				osc.connect(gain)
				osc.connect(ac.destination)
				gain.gain.setValueAtTime(0, ac.currentTime)
				gain.gain.linearRampToValueAtTime(0.3, ac.currentTime + 0.01)
				osc.start(ac.currentTime)
			}

			function stop() {
				gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.01)
				osc.stop(ac.currentTime + 0.02)
			}

			if (current !== lastFetch) { // if new posts
				send()
				return
			}

			const wpm =20
			const dits = (60 / (50 * wpm)) * 1000

			const delay = getDelay(char)
			posts[i] += char
			print()
			if (['.','-'].includes(char)) play()
			await sleep(delay*dits) // hold tone
			if (['.','-'].includes(char)) stop()
			if (char !== '/') await sleep(dits) // space between tones
		}
	}
}