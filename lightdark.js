document.addEventListener("DOMContentLoaded", () => {
	const toggle = document.getElementById("darkToggle");
	const html = document.documentElement;

	const svgLight = `
		<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="4"/><path d="m7 0h2v2h-2z"/><path d="m7 14h2v2h-2z"/><path d="m16 7v2h-2v-2z"/><path d="m2 7v2h-2v-2z"/><path d="m11.5 3 1.5-1.5 1.5 1.5-1.5 1.5z"/><path d="m1.5 3 1.5-1.5 1.5 1.5-1.5 1.5z"/><path d="m11.51 13 1.5-1.5 1.5 1.5-1.5 1.5z"/><path d="m1.5 13 1.5-1.5 1.5 1.5-1.5 1.5z"/></svg>
	`;

	const svgDark = `
		<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="m11 10c-2.76 0-5-2.24-5-5 0-1.64.79-3.09 2-4-3.87 0-7 3.13-7 7s3.13 7 7 7 7-3.13 7-7c-.91 1.21-2.36 2-4 2z"/></svg>
	`;

	function updateIcon() {
		if (html.classList.contains("manualDark")) {
			toggle.innerHTML = svgLight;
		} else if (html.classList.contains("manualLight")) {
			toggle.innerHTML = svgDark;
		} else {
			const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			toggle.innerHTML = isSystemDark ? svgLight : svgDark;
		}
	}

	toggle.addEventListener("click", (e) => {
		e.preventDefault();

		if (html.classList.contains("manualDark")) {
			html.classList.remove("manualDark");
			html.classList.add("manualLight");
		} else if (html.classList.contains("manualLight")) {
			html.classList.remove("manualLight");
			html.classList.add("manualDark");
		} else {
			const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			html.classList.add(isSystemDark ? "manualLight" : "manualDark");
		}

		updateIcon();
	});
	updateIcon();
});
