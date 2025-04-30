const popup = document.getElementById('popup');
const infoButton = document.getElementById('infoButton');
const closeButton = document.getElementById('closePopup');

infoButton.addEventListener('click', (e) => {
	e.preventDefault();
	popup.classList.add('show');
});

closeButton.addEventListener('click', () => {
	popup.classList.remove('show');
});

window.addEventListener('click', (e) => {
	if (!popup.contains(e.target) && e.target !== infoButton) {
		popup.classList.remove('show');
	}
});