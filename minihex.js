// Color Converter
const colorConverter = {
	hsvToRgb(h, s, v, asArray = false) {
		h = h % 360;
		const c = v * s;
		const x = c * (1 - Math.abs((h / 60) % 2 - 1));
		const m = v - c;

		let r, g, b;
		if (h < 60)			[r, g, b] = [c, x, 0];
		else if (h < 120)	[r, g, b] = [x, c, 0];
		else if (h < 180)	[r, g, b] = [0, c, x];
		else if (h < 240)	[r, g, b] = [0, x, c];
		else if (h < 300)	[r, g, b] = [x, 0, c];
		else				[r, g, b] = [c, 0, x];

		r = Math.round((r + m) * 255);
		g = Math.round((g + m) * 255);
		b = Math.round((b + m) * 255);

		return asArray ? [r, g, b] : { r, g, b };
	},

	rgbToHex({ r, g, b }) {
		return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
	},

	toShorthandHex(hex) {
		if (typeof hex !== 'string') return null;
		const match = hex.match(/^#?([0-9a-f]{6})$/i);
		if (!match) return null;

		const fullHex = match[1].toLowerCase();
		const shorthand = [0, 2, 4].map(i =>
			Math.round(parseInt(fullHex.slice(i, i + 2), 16) / 17).toString(16)
		).join('');

		return `#${shorthand}`;
	},

	parseInputRgb(input) {
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
			const match = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
			if (match) {
				return {
					r: parseInt(match[1]),
					g: parseInt(match[2]),
					b: parseInt(match[3]),
				};
			}
		}
		return null;
	},

	updateHcolorFieldFromRgb(rgb, hcolorField, updateUI) {
		let { r, g, b } = rgb;
			r /= 255;
			g /= 255;
			b /= 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const delta = max - min;

		let h = 0;
		if (delta !== 0) {
			if		(max === r) h = 60 * (((g - b) / delta) % 6);
			else if	(max === g) h = 60 * (((b - r) / delta) + 2);
			else				h = 60 * (((r - g) / delta) + 4);
		}

		hcolorField.h = (h + 360) % 360;
		hcolorField.v = max;
		hcolorField.s = max === 0 ? 0 : delta / max;

		updateUI();
	}
};


// Color Picker
function rem(units) {
	return units * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function parseFlexibleRgbInput(value) {
	const cleaned = value.replace(/[^\d,\s]/g, '');
	const parts = cleaned.trim().split(/[\s,]+/).map(n => parseInt(n, 10));

	if (parts.length !== 3 || parts.some(n => isNaN(n))) {
		return null;
	}

	const [r, g, b] = parts.map(n => Math.min(255, Math.max(0, n)));
	return { r, g, b };
}

class colorPickerUI {
	constructor() {
		this.elements = {
			colorFieldCanvas: document.getElementById('colorFieldCanvas'),
			buttonCopy: document.getElementById('buttonCopy'),
			eyedropper: document.getElementById('eyedropper'),
			hueSlider: document.getElementById('hueSlider'),
			hueThumb: document.getElementById('hueThumb'),
			inputHex: document.getElementById('inputHex'),
			inputRgb: document.getElementById('inputRgb'),
			inputShorthandHex: document.getElementById('inputShorthandHex'),
			previewColor: document.getElementById('previewColor'),
			previewShorthandHex: document.getElementById('previewShorthandHex')
		};

		this.ctx = this.elements.colorFieldCanvas.getContext('2d');

		this.hcolorField = { h: 0, s: 0, v: 1 };

		this.needsCanvasRedraw = true;
		this.lastHue = null;
		this.isRafScheduled = false;

		this.initEventListeners();
		this.initButtonCopy();

		this.resizeCanvas();
		this.hcolorField.h = 180;
		this.updateUI();
	}

	drawColorFieldCanvas(hue) {
		if (this.lastHue === hue && !this.needsCanvasRedraw) return;
		this.lastHue = hue;
		this.needsCanvasRedraw = false;

		const ctx = this.ctx;
		const canvas = this.elements.colorFieldCanvas;
		const width = canvas.width;
		const height = canvas.height;
		const imageData = ctx.createImageData(width, height);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const s = x / width;
				const v = 1 - y / height;
				const { r, g, b } = colorConverter.hsvToRgb(hue, s, v);
				const i = (y * width + x) * 4;
				imageData.data[i]     = r;
				imageData.data[i + 1] = g;
				imageData.data[i + 2] = b;
				imageData.data[i + 3] = 255;
			}
		}

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.putImageData(imageData, 0, 0);
	}

	scheduleUpdateUI() {
		if (this.isRafScheduled) return;
		this.isRafScheduled = true;
		requestAnimationFrame(() => {
			this.updateUI();
			this.isRafScheduled = false;
		});
	}

	updateUI() {
		const { h, s, v } = this.hcolorField;

		this.drawColorFieldCanvas(h);

		const { r, g, b } = colorConverter.hsvToRgb(h, s, v);
		const fullHex = colorConverter.rgbToHex({ r, g, b });
		const shorthand = colorConverter.toShorthandHex(fullHex);

		this.elements.inputHex.value = fullHex;
		this.elements.inputRgb.value = `rgb(${r}, ${g}, ${b})`;
		this.elements.inputShorthandHex.value = shorthand;

		this.elements.previewColor.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
		this.elements.previewShorthandHex.style.backgroundColor = shorthand;

		this.updateThumbPosition(h);
		this.updateEyedropperPosition(s, v, r, g, b);
	}

	updateThumbPosition(h) {
		const hueWidth = this.elements.hueSlider.clientWidth;
		const hueWidthInRem = hueWidth / this.getRemSize();
		this.elements.hueThumb.style.left = `${(h / 360) * hueWidthInRem - 0.0625}rem`;
	}

	updateEyedropperPosition(s, v, r, g, b) {
		const dropSize = 0.75;
		const canvasWidthInRem = this.elements.colorFieldCanvas.clientWidth / this.getRemSize();
		const canvasHeightInRem = this.elements.colorFieldCanvas.clientHeight / this.getRemSize();

		this.elements.eyedropper.style.left = `${s * canvasWidthInRem - dropSize}rem`;
		this.elements.eyedropper.style.top = `${(1 - v) * canvasHeightInRem - dropSize}rem`;
		this.elements.eyedropper.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
	}

	getRemSize() {
		return parseFloat(getComputedStyle(document.documentElement).fontSize);
	}

	resizeCanvas() {
		const canvas = this.elements.colorFieldCanvas;
		const parent = canvas.parentElement;
		const dpr = window.devicePixelRatio || 1;

		const width = Math.min(parent.clientWidth, window.innerWidth);
		const height = width / 2;

		canvas.width = width * dpr;
		canvas.height = height * dpr;

		const remSize = this.getRemSize();
		canvas.style.width = `${width / remSize}rem`;
		canvas.style.height = `${height / remSize}rem`;

		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.scale(dpr, dpr);

		this.needsCanvasRedraw = true;
		this.scheduleUpdateUI();
	}

	setHueFromEvent(e) {
		const rect = this.elements.hueSlider.getBoundingClientRect();
		const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
		this.hcolorField.h = (x / rect.width) * 360;
		this.needsCanvasRedraw = true;
		this.scheduleUpdateUI();
	}

	setColorFieldFromEvent(e) {
		const rect = this.elements.colorFieldCanvas.getBoundingClientRect();
		const s = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
		const v = 1 - Math.min(Math.max(0, e.clientY - rect.top), rect.height) / rect.height;
		this.hcolorField.s = s;
		this.hcolorField.v = v;
		this.scheduleUpdateUI();
	}

	handleInputHex() {
		let value = this.elements.inputHex.value.replace(/[^0-9a-fA-F]/g, '');
		if (value.length > 6) value = value.slice(0, 6);
		this.elements.inputHex.value = '#' + value;

		const rgb = colorConverter.parseInputRgb(this.elements.inputHex.value);
		if (rgb) {
			colorConverter.updateHcolorFieldFromRgb(rgb, this.hcolorField, () => this.scheduleUpdateUI());
		}
	}

handleInputRgb() {
	const input = this.elements.inputRgb;
	const rgb = parseFlexibleRgbInput(input.value);

	if (rgb) {
		// Reformat to standard format
		input.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
		colorConverter.updateHcolorFieldFromRgb(rgb, this.hcolorField, () => this.scheduleUpdateUI());
	}
}

	handleInputShorthandHex() {
		let value = this.elements.inputShorthandHex.value;
		value = value.replace(/[^0-9a-fA-F#]/g, '');
		if (value.startsWith('#')) {
			value = value.slice(1);
		}

		if (value.length > 3) {
			value = value.slice(0, 3);
		}

		this.elements.inputShorthandHex.value = '#' + value;

		if (value.length === 3 && /^[0-9a-fA-F]{3}$/.test(value)) {
			const expandedHex = value.split('').map(c => c + c).join('');
			const rgb = colorConverter.parseInputRgb('#' + expandedHex);
			if (rgb) {
				colorConverter.updateHcolorFieldFromRgb(rgb, this.hcolorField, () => this.scheduleUpdateUI());
			}
		}
	}

	initEventListeners() {
		const throttle = (fn, limit) => {
			let lastFn;
			let lastRan;
			return function (...args) {
				if (!lastRan) {
					fn.apply(this, args);
					lastRan = Date.now();
				} else {
					clearTimeout(lastFn);
					lastFn = setTimeout(() => {
						if ((Date.now() - lastRan) >= limit) {
							fn.apply(this, args);
							lastRan = Date.now();
						}
					}, limit - (Date.now() - lastRan));
				}
			};
		};

		this.elements.inputRgb.addEventListener('input', throttle(() => this.handleInputRgb(), 200));

		this.elements.inputRgb.addEventListener('blur', () => {
			this.handleInputRgb();
		});

		const setupPointerHandler = (element, handler) => {
			if (window.PointerEvent) {
				element.addEventListener('pointerdown', e => {
					e.preventDefault();
					element.setPointerCapture(e.pointerId);

					const move = throttle(event => {
						event.preventDefault();
						handler(event);
					}, 16);

					const up = event => {
						element.releasePointerCapture(event.pointerId);
						document.removeEventListener('pointermove', move);
						document.removeEventListener('pointerup', up);
						document.removeEventListener('pointercancel', up);
					};

					document.addEventListener('pointermove', move, { passive: false });
					document.addEventListener('pointerup', up);
					document.addEventListener('pointercancel', up);

					handler(e);
				});
			} else {
				let mouseDown = false;
				element.addEventListener('mousedown', e => {
					e.preventDefault();
					mouseDown = true;
					handler(e);
				});
				document.addEventListener('mousemove', e => {
					if (!mouseDown) return;
					e.preventDefault();
					handler(e);
				});
				document.addEventListener('mouseup', e => {
					mouseDown = false;
				});
			}
		};

		setupPointerHandler(this.elements.hueSlider, e => this.setHueFromEvent(e));
		setupPointerHandler(this.elements.colorFieldCanvas, e => this.setColorFieldFromEvent(e));

		this.elements.inputHex.addEventListener('input', throttle(() => this.handleInputHex(), 200));
		this.elements.inputRgb.addEventListener('input', throttle(() => this.handleInputRgb(), 200));
		this.elements.inputShorthandHex.addEventListener('input', throttle(() => this.handleInputShorthandHex(), 200));

		let resizeTimeout;
		const handleResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				requestAnimationFrame(() => {
					this.resizeCanvas();
				});
			}, 250);
		};

		window.addEventListener('resize', handleResize);
		window.addEventListener('orientationchange', handleResize);
	}

	initButtonCopy() {
		const btn = this.elements.buttonCopy;
		btn.addEventListener('click', () => {
			const text = this.elements.inputShorthandHex.value;
			if (!navigator.clipboard) return;

			navigator.clipboard.writeText(text).then(() => {
				const originalText = btn.textContent;
				btn.textContent = '✓';
				setTimeout(() => {
					btn.textContent = originalText;
				}, 1500);
			});
		});
	}
}


// Init
document.addEventListener('DOMContentLoaded', () => {
	const colorPicker = new colorPickerUI();
	colorPicker.resizeCanvas();
	colorPicker.updateUI();
});
