
/// <reference types="better-typescript" />
// @ts-nocheck

(async () => {
	let /** @type {Set<string>} */ browserProperties = new Set();
	let /** @type {Set<string>} */ speccedProperties = new Set();
	let /** @type {Set<string>} */ webindexProperties = new Set();
	let /** @type {Set<string>} */ allProperties = new Set();
	let /** @type {string[]} */ nonStandardProperties = [];

	const propertiesThatMightComputeToEmptyString = new Set([
		"all", "webkitMask", "webkitTextStroke",
		"webkitTransformOriginX", "webkitTransformOriginY", "webkitTransformOriginZ",
		"transformOriginX", "transformOriginY", "transformOriginZ",
		"webkitPerspectiveOriginX", "webkitPerspectiveOriginY",
	]); // https://crbug.com/1510955

	{
		const computedStyle = window.getComputedStyle(document.documentElement);
		for (let property in computedStyle) {
			if (
				typeof computedStyle[property] !== "string" || /^[0-9]+$/.test(property) || property === "cssFloat"
				||
				(!computedStyle[property] && !propertiesThatMightComputeToEmptyString.has(property) )
			) continue;
			property = property.replaceAll(/(?<capital>[A-Z])/g, "-$<capital>").replace(/^(?<vendorPrefix>webkit-|moz-|epub-)/i, "-$<vendorPrefix>").toLowerCase();
			browserProperties.add(property);
			allProperties.add(property);
		}
	}

	{
		const indexesURL = "https://drafts.csswg.org/indexes/";
		const doc = new DOMParser().parseFromString(await (await window.fetch(indexesURL)).text(), "text/html");
		for (const element of doc.querySelectorAll("#properties + div > .index > li")) {
			const property = element.firstChild.textContent.trim();
			if (property.startsWith("--") || element.firstChild.href?.match(/#descdef-/)) continue;
			speccedProperties.add(property);
			allProperties.add(property);
		}
	}

	{
		const { cssProperties } = await (await window.fetch("/webindex/index/css.json")).json();
		for (const { name } of cssProperties) {
			if (name.startsWith("--")) continue;
			webindexProperties.add(name);
			allProperties.add(name);
		}
	}

	{
		const tbody = document.querySelector("table#properties > tbody");
		const fragment = tbody.querySelector(":scope > template").content;
		for (const property of [...allProperties].sort()) {
			const clone = fragment.cloneNode(true);
			if (browserProperties.has(property)) clone.querySelector(".browser").textContent = property;
			if (webindexProperties.has(property)) clone.querySelector(".webindex").textContent = property;
			if (speccedProperties.has(property)) clone.querySelector(".specced").textContent = property;
			tbody.append(clone);
			if (
				browserProperties.has(property)
				&& !webindexProperties.has(property)
				&& !(property.startsWith("-webkit-") && speccedProperties.has(property))
			) {
				console.log(property);
				nonStandardProperties.push(property);
			}
		}
	}

	document.querySelector("button#copy-non-standard").addEventListener("click", () => {
		navigator.clipboard.writeText(nonStandardProperties.join("\n"));
	});

	// console.log(webindexProperties.filter(p => (browserProperties.has(`-webkit-${p}`) || browserProperties.has(`-moz-${p}`)) && !browserProperties.has(p)))
})();

export { };
