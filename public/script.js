const socket = io()
let stream = ''

socket.on('message', (char) => {
	stream += char
	const slice = stream.split(' ').slice(-1)[0] || '&nbsp'
	document.getElementById('top').innerHTML = decode(slice).toUpperCase() + ' ' + slice

	let list = decode(stream)
		.toUpperCase()
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.split('&lt;BT&gt;')
		.reverse()
	document.getElementById('out').innerHTML = list.map(el => (el.indexOf('&lt;CT&gt;') !== -1 ? '<hr>' : '') + el + '<BT><hr>').join('')
})