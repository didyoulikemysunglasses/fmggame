document.addEventListener('DOMContentLoaded', (event) => {
	fetch('./intro.txt').then(response => {
		response.text().then(result => {
			document.getElementById('textParagraph').innerHTML = result;
		});
	});
})
