export const collectVisibleText = () => {
	const hidden = (element) => {
		if (element.closest('[hidden], [inert]')) return true;
		if (typeof element.checkVisibility === 'function') {
			return !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
		}
		if (!(element instanceof HTMLElement)) {
			return true;
		}
		for (let current = element; current; current = current.parentElement) {
			const style = window.getComputedStyle(current);
			if (
				style.display === 'none' ||
				style.visibility === 'hidden' ||
				style.visibility === 'collapse' ||
				Number(style.opacity) === 0
			) {
				return true;
			}
		}
		return false;
	};

	const parts = [];
	const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	while (walker.nextNode()) {
		const node = walker.currentNode;
		const parent = node.parentElement;
		if (!parent || hidden(parent)) continue;
		const value = node.textContent.trim();
		if (value) parts.push(value);
	}
	for (const element of document.querySelectorAll('body *')) {
		if (hidden(element)) continue;
		for (const attribute of ['aria-label', 'title', 'placeholder', 'alt']) {
			const value = element.getAttribute(attribute);
			if (value && value.trim()) parts.push(value);
		}
	}
	return parts.join('\n');
};
