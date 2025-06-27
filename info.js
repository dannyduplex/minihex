const popupBackdrop = document.getElementById('popupBackdrop');
const popup = document.getElementById('popup');
const infoButton = document.getElementById('infoButton');
const closeButton = document.getElementById('closePopup');

infoButton.addEventListener('click', (e) => {
	e.preventDefault();
	popupBackdrop.classList.add('show');
	popup.classList.add('show');
});

closeButton.addEventListener('click', () => {
	popupBackdrop.classList.remove('show');
	popup.classList.remove('show');
});

popupBackdrop.addEventListener('click', (e) => {
	if (!popup.contains(e.target)) {
		popupBackdrop.classList.remove('show');
		popup.classList.remove('show');
	}
});

window.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		popupBackdrop.classList.remove('show');
		popup.classList.remove('show');
	}
});
