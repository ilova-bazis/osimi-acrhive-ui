export const collectVisibleText = () => {
	const hidden = (element) => {
		if (typeof element.checkVisibility === 'function') {
			return !element.checkVisibility({ checkVisibilityCSS: true });
		}
		if (!(element instanceof HTMLElement)) {
			return true;
		}
		const style = window.getComputedStyle(element);
		if (style.display === 'none' || style.visibility === 'hidden') {
			return true;
		}
		return element.closest('[hidden]') !== null;
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
