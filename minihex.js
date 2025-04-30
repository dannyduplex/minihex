const elements = {
	hueSlider: document.getElementById('hueSlider'),
	hueThumb: document.getElementById('hueThumb'),
	colorFieldCanvas: document.getElementById('colorFieldCanvas'),
	eyedropper: document.getElementById('eyedropper'),
	hexInput: document.getElementById('hexInput'),
	rgbInput: document.getElementById('rgbInput'),
	shorthandHexInput: document.getElementById('shorthandHexInput'),
	colorPreview: document.getElementById('colorPreview'),
	shorthandHexPreview: document.getElementById('shorthandHexPreview'),
};

const ctx = elements.colorFieldCanvas.getContext('2d');

let hcolorField = { h: 0, s: 0, v: 1 };

function hsvToRgb(h, s, v, asArray = false) {
	h = h % 360;
	const c = v * s;
	const x = c * (1 - Math.abs((h / 60) % 2 - 1));
	const m = v - c;

	let r, g, b;
	if (h < 60)       [r, g, b] = [c, x, 0];
	else if (h < 120) [r, g, b] = [x, c, 0];
	else if (h < 180) [r, g, b] = [0, c, x];
	else if (h < 240) [r, g, b] = [0, x, c];
	else if (h < 300) [r, g, b] = [x, 0, c];
	else              [r, g, b] = [c, 0, x];

	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return asArray ? [r, g, b] : { r, g, b };
}

function rgbToHex({ r, g, b }) {
	return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function toShorthandHex(hex) {
	if (typeof hex !== 'string') return null;
	const match = hex.match(/^#?([0-9a-f]{6})$/i);
	if (!match) return null;

	const fullHex = match[1].toLowerCase();
	const shorthand = [0, 2, 4].map(i =>
		Math.round(parseInt(fullHex.slice(i, i + 2), 16) / 17).toString(16)
	).join('');

	return `#${shorthand}`;
}

function drawcolorFieldCanvas(hue) {
	const width = colorFieldCanvas.width;
	const height = colorFieldCanvas.height;
	const imageData = ctx.createImageData(width, height);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const s = x / width;
			const v = 1 - y / height;
			const { r, g, b } = hsvToRgb(hue, s, v);
			const i = (y * width + x) * 4;
			imageData.data[i]     = r;
			imageData.data[i + 1] = g;
			imageData.data[i + 2] = b;
			imageData.data[i + 3] = 255;
		}
	}

	ctx.putImageData(imageData, 0, 0);
}

function updateUI() {
	const { r, g, b } = hsvToRgb(hcolorField.h, hcolorField.s, hcolorField.v);
	const fullHex = rgbToHex({ r, g, b });
	const shorthand = toShorthandHex(fullHex);
	
	const x = Math.round(hcolorField.s * colorFieldCanvas.width);
	const y = Math.round((1 - hcolorField.v) * colorFieldCanvas.height);

	const dropSize = 12;

	hexInput.value = fullHex;
	rgbInput.value = `rgb(${r}, ${g}, ${b})`;
	shorthandHexInput.value = shorthand;

	colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
	shorthandHexPreview.style.backgroundColor = shorthand;

	const hueWidth = hueSlider.clientWidth;
	hueThumb.style.left = (hcolorField.h / 360) * hueWidth - 1 + 'px';

	drawcolorFieldCanvas(hcolorField.h);

	eyedropper.style.left = (hcolorField.s * colorFieldCanvas.clientWidth - dropSize) + 'px';
	eyedropper.style.top = ((1 - hcolorField.v) * colorFieldCanvas.clientHeight - dropSize) + 'px';
	eyedropper.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

function handlePointerDown(element, setColorFunction) {
	element.addEventListener('pointerdown', (e) => {
		e.preventDefault();
		element.setPointerCapture(e.pointerId);

		const move = (ev) => {
			ev.preventDefault();
			setColorFunction(ev);
		};
		const up = (ev) => {
			element.releasePointerCapture(ev.pointerId);
			document.removeEventListener('pointermove', move);
			document.removeEventListener('pointerup', up);
			document.removeEventListener('pointercancel', up);
		};

		document.addEventListener('pointermove', move, { passive: false });
		document.addEventListener('pointerup', up);
		document.addEventListener('pointercancel', up);
		setColorFunction(e);
	});
}

function setHueFromEvent(e) {
	const rect = hueSlider.getBoundingClientRect();
	hcolorField.h = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width * 360;
	updateUI();
}

function setcolorFieldFromEvent(e) {
	const rect = colorFieldCanvas.getBoundingClientRect();
	hcolorField.s = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
	hcolorField.v = 1 - Math.min(Math.max(0, e.clientY - rect.top), rect.height) / rect.height;
	updateUI();
}

function parseRGBInput(input) {
	if (input.startsWith('#')) {
		const hex = input.slice(1).replace(/[^0-9a-f]/gi, '');
		if (hex.length === 6) {
			return {
				r: parseInt(hex.slice(0, 2), 16),
				g: parseInt(hex.slice(2, 4), 16),
				b: parseInt(hex.slice(4, 6), 16),
			};
		}
	} else {
		const match = input.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);
		if (match) {
			return {
				r: parseInt(match[1]),
				g: parseInt(match[2]),
				b: parseInt(match[3]),
			};
		}
	}
	return null;
}


function updateHcolorFieldFromRGB({ r, g, b }) {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;

	let h = 0;
	if (delta !== 0) {
		if (max === r) h = 60 * (((g - b) / delta) % 6);
		else if (max === g) h = 60 * (((b - r) / delta) + 2);
		else               h = 60 * (((r - g) / delta) + 4);
	}

	hcolorField.h = (h + 360) % 360;
	hcolorField.v = max;
	hcolorField.s = max === 0 ? 0 : delta / max;

	updateUI();
}

hexInput.addEventListener('input', () => {
	let value = hexInput.value.replace(/[^0-9a-fA-F]/g, '');
	if (value.length > 6) value = value.slice(0, 6);
	hexInput.value = '#' + value;

	const rgb = parseRGBInput(hexInput.value);
	if (rgb) updateHcolorFieldFromRGB(rgb);
});

rgbInput.addEventListener('input', () => {
	let value = rgbInput.value;
	value = value.replace(/[^\d,]/g, '');
	const parts = value.split(',').map(v => v.trim().slice(0, 3)).slice(0, 3);
	const clamped = parts.map(num => {
		const n = parseInt(num, 10);
		return isNaN(n) ? 0 : Math.min(255, n);
	});

	const formatted = `rgb(${clamped.join(', ')})`;
	rgbInput.value = formatted;

	if (clamped.length === 3) {
		const rgb = { r: clamped[0], g: clamped[1], b: clamped[2] };
		updateHcolorFieldFromRGB(rgb);
	}
});

shorthandHexInput.addEventListener('input', () => {
	let value = shorthandHexInput.value;
	value = value.replace(/[^0-9a-fA-F#]/g, '');
	if (value.startsWith('#')) {
		value = value.slice(1);
	}

	if (value.length > 3) {
		value = value.slice(0, 3);
	}

	shorthandHexInput.value = '#' + value;

	if (value.length === 3 && /^[0-9a-fA-F]{3}$/.test(value)) {
		const expandedHex = value.split('').map(c => c + c).join('');
		const rgb = parseRGBInput('#' + expandedHex);
		if (rgb) updateHcolorFieldFromRGB(rgb);
	}
});

const copyButton = document.getElementById('copyButton');

copyButton.addEventListener('click', () => {
	const hex = shorthandHexInput.value;
	if (hex) {
		navigator.clipboard.writeText(hex)
			.then(() => {
				copyButton.textContent = '✓';
				setTimeout(() => copyButton.textContent = 'Copy', 1500);
			})
	}
});

hcolorField.h = 180;
handlePointerDown(hueSlider, setHueFromEvent);
handlePointerDown(colorFieldCanvas, setcolorFieldFromEvent);

function resizeCanvas() {
	const rect = colorFieldCanvas.getBoundingClientRect();
	drawcolorFieldCanvas(hcolorField.h);
	updateUI();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('DOMContentLoaded', resizeCanvas);

updateUI();