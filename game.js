document.addEventListener('DOMContentLoaded', (event) => {
	fetch('./intro.txt').then(result => {
		document.getElementById('textParagraph').innerHTML = result;
	});
})
