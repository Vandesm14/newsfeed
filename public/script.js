const socket = io()
let stream = ''

let audio = false
let show = false

document.getElementById('toggle').addEventListener('click', () => audio = !audio)
document.getElementById('show').addEventListener('click', () => show = !show)

function getDelay(char) {
	if (char === '.') return 1 // dot
	else if (char === '-') return 3 // dash or space
	else return 0 // unknown
}

const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds))

socket.on('message', async (char) => {
	const ctx = window.AudioContext ? new AudioContext() : new webkitAudioContext()

	stream += char
	const slice = stream.split(' ').slice(-1)[0] || '&nbsp'
	document.getElementById('top').innerHTML = decode(slice).toUpperCase() + ' ' + slice.replace(/\./g, '•')

	document.getElementById('raw').innerHTML = show ? stream.split('-...-').slice(-1)[0].replace(/\./g, '•') : '	'

	let list = decode(stream)
		.toUpperCase()
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.split('&lt;BT&gt;')
		.reverse()
	document.getElementById('out').innerHTML = list.map(el => (el.indexOf('&lt;CT&gt;') !== -1 ? '<hr>' : '') + el + '<BT><hr>').join('')

	// Sound
	const wpm = 30
	const dits = (60 / (50 * wpm)) * 1000
	const delay = getDelay(char)
	const sound = new SoundPlayer(ctx)
	if ((char === '.' || char === '-') && audio) {
		sound.play(600, 0.5, 'sine')
		await sleep(dits*delay)
		sound.stop()
		await sleep(dits)
	}
})