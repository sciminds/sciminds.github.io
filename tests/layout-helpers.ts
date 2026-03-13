import { type Page, expect } from '@playwright/test';

/** Viewport widths matching the project's design breakpoints */
export const BREAKPOINTS = {
	mobile: 375,
	sm: 640,
	md: 768,
	lg: 1024,
	'2xl': 1536
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/** Set viewport to a named breakpoint */
export async function setBreakpoint(page: Page, bp: BreakpointName) {
	await page.setViewportSize({ width: BREAKPOINTS[bp], height: 800 });
}

/** Assert no horizontal overflow on the page */
export async function expectNoHorizontalOverflow(page: Page) {
	const overflow = await page.evaluate(() => {
		const doc = document.documentElement;
		return doc.scrollWidth > doc.clientWidth;
	});
	expect(overflow, 'Page has horizontal overflow').toBe(false);
}

/** Assert an element's width does not exceed a max pixel value */
export async function expectMaxWidth(page: Page, selector: string, maxPx: number) {
	const width = await page.$eval(selector, (el) => el.getBoundingClientRect().width);
	expect(width, `${selector} width ${width}px exceeds max ${maxPx}px`).toBeLessThanOrEqual(maxPx);
}

/** Assert that flex/grid children wrap into multiple rows (not all on one line) */
export async function expectWrapped(page: Page, selector: string) {
	const rows = await page.$$eval(selector, (els) => {
		const tops = els.map((el) => Math.round(el.getBoundingClientRect().top));
		return new Set(tops).size;
	});
	expect(rows, `Elements "${selector}" should wrap into multiple rows`).toBeGreaterThan(1);
}

/** Assert that all matched elements sit on the same row (same top position, ±2px tolerance) */
export async function expectSameRow(page: Page, selector: string) {
	const tops = await page.$$eval(selector, (els) =>
		els.map((el) => Math.round(el.getBoundingClientRect().top))
	);
	const unique = new Set(tops);
	expect(
		unique.size,
		`Elements "${selector}" should be on the same row but found ${unique.size} rows`
	).toBe(1);
}

/**
 * Assert vertical spacing between consecutive matched elements is within a range.
 * Measures gap between bottom of element N and top of element N+1.
 */
export async function expectVerticalSpacing(
	page: Page,
	selector: string,
	minPx: number,
	maxPx: number
) {
	const gaps = await page.$$eval(selector, (els) => {
		const result: number[] = [];
		for (let i = 0; i < els.length - 1; i++) {
			const a = els[i].getBoundingClientRect();
			const b = els[i + 1].getBoundingClientRect();
			result.push(b.top - a.bottom);
		}
		return result;
	});

	for (const [i, gap] of gaps.entries()) {
		expect(
			gap,
			`Gap between "${selector}" items ${i} and ${i + 1}: ${gap}px not in [${minPx}, ${maxPx}]`
		).toBeGreaterThanOrEqual(minPx);
		expect(gap).toBeLessThanOrEqual(maxPx);
	}
}

/**
 * Assert elements are left-aligned with each other (same left edge, ±tolerance).
 */
export async function expectLeftAligned(page: Page, selector: string, tolerancePx = 2) {
	const lefts = await page.$$eval(selector, (els) =>
		els.map((el) => Math.round(el.getBoundingClientRect().left))
	);
	if (lefts.length < 2) return;
	const base = lefts[0];
	for (const [i, left] of lefts.entries()) {
		expect(
			Math.abs(left - base),
			`"${selector}" item ${i} left edge (${left}px) misaligned from first (${base}px)`
		).toBeLessThanOrEqual(tolerancePx);
	}
}

/** Assert element is horizontally centered within viewport (±tolerance) */
export async function expectCentered(page: Page, selector: string, tolerancePx = 4) {
	const info = await page.$eval(selector, (el) => {
		const rect = el.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const elementCenter = rect.left + rect.width / 2;
		const viewportCenter = viewportWidth / 2;
		return { elementCenter, viewportCenter };
	});
	expect(
		Math.abs(info.elementCenter - info.viewportCenter),
		`"${selector}" is not centered (element: ${info.elementCenter}px, viewport: ${info.viewportCenter}px)`
	).toBeLessThanOrEqual(tolerancePx);
}

/** Assert text content is present and not empty for a selector */
export async function expectHasText(page: Page, selector: string) {
	const text = await page.$eval(selector, (el) => el.textContent?.trim() ?? '');
	expect(text.length, `"${selector}" has no text content`).toBeGreaterThan(0);
}
