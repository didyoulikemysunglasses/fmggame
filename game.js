document.addEventListener('DOMContentLoaded', (event) => {
	fetch('./intro.txt').then(response => {
		response.text(result => {
			document.getElementById('textParagraph').innerHTML = result;
		});
	});
})
