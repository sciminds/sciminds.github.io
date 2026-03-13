import { test, expect } from '@playwright/test';
import {
	BREAKPOINTS,
	type BreakpointName,
	setBreakpoint,
	expectNoHorizontalOverflow,
	expectMaxWidth
} from './layout-helpers';

const ROUTES = ['/', '/team', '/read', '/focus', '/build', '/learn', '/connect'];

// ---------------------------------------------------------------------------
// 1. Every route loads and has no horizontal overflow at every breakpoint
// ---------------------------------------------------------------------------
for (const route of ROUTES) {
	for (const bp of Object.keys(BREAKPOINTS) as BreakpointName[]) {
		test(`${route} @ ${bp} (${BREAKPOINTS[bp]}px): no overflow`, async ({ page }) => {
			await setBreakpoint(page, bp);
			const res = await page.goto(route, { waitUntil: 'networkidle' });
			expect(res?.status()).toBe(200);
			await expectNoHorizontalOverflow(page);
		});
	}
}

// ---------------------------------------------------------------------------
// 2. Prose content stays within readable width
// ---------------------------------------------------------------------------
for (const route of ROUTES) {
	test(`${route}: prose content has readable width`, async ({ page }) => {
		await setBreakpoint(page, 'lg');
		await page.goto(route, { waitUntil: 'networkidle' });

		const proseEl = await page.$('.prose');
		if (proseEl) {
			// max-w-[78ch] at lg ≈ ~1000px depending on font; keep under 1050px
			await expectMaxWidth(page, '.prose', 1050);
		}
	});
}

// ---------------------------------------------------------------------------
// 3. Navigation is present and accessible on all routes
// ---------------------------------------------------------------------------
for (const route of ROUTES) {
	test(`${route}: nav is present`, async ({ page }) => {
		await page.goto(route, { waitUntil: 'networkidle' });
		const nav = page.locator('nav').first();
		await expect(nav).toBeVisible();
	});
}

// ---------------------------------------------------------------------------
// 4. Dark mode toggle doesn't break layout
// ---------------------------------------------------------------------------
test('dark mode toggle preserves layout integrity', async ({ page }) => {
	await setBreakpoint(page, 'lg');
	await page.goto('/', { waitUntil: 'networkidle' });

	// Toggle dark mode
	const toggle = page.locator('button:has([class*="sun"], [class*="moon"], .icon)').first();
	if (await toggle.isVisible()) {
		await toggle.click();
		await page.waitForTimeout(300); // allow transition

		// Verify html has dark class
		const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

		// Toggle back
		await toggle.click();
		await page.waitForTimeout(300);

		const hasDarkAfter = await page.evaluate(() =>
			document.documentElement.classList.contains('dark')
		);

		// One of these should have been dark
		expect(hasDark !== hasDarkAfter).toBe(true);
	}

	// No overflow after toggling
	await expectNoHorizontalOverflow(page);
});

// ---------------------------------------------------------------------------
// 5. Page content is not empty
// ---------------------------------------------------------------------------
for (const route of ROUTES) {
	test(`${route}: page has content`, async ({ page }) => {
		await page.goto(route, { waitUntil: 'networkidle' });
		const bodyText = await page.evaluate(() => document.body.innerText.trim());
		expect(bodyText.length).toBeGreaterThan(50);
	});
}
