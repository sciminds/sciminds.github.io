<!--
  SplitText - Animated text component that moves letters from a full name to spell an acronym
  
  Uses ResizeObserver + layout stability detection to prevent layout shift issues.
  Waits for fonts to load and layout to stabilize before measuring positions.
-->

<script>
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { SvelteSet } from 'svelte/reactivity';

	// Props with defaults
	let {
		// Delay between each letter animation (ms)
		staggerDelay = 200,

		// How long each letter takes to fly (ms)
		animationDuration = 250,

		// Delay for initial text appearance (ms)
		characterStagger = 40,

		// Delay before clone animations start (ms) - allows full text to appear first
		baseDelay = 400,

		// Hide full text after animation completes
		hideFullTextAfterAnimation = false,

		// Semantic color for flying letters: 'primary' (sky-500), 'secondary' (rose-500), or 'accent' (cyan-400)
		accentColor = 'primary',

		// Force animation to play even if user prefers reduced motion (default: false for accessibility)
		forceAnimation = true,

		// Delay between last clone landing and starting the transition (ms)
		acronymTransitionDelay = 0,

		// How fast clones fade out (ms)
		cloneFadeDuration = 0,

		// Overlap between clone fade-out and acronym fade-in (ms)
		transitionOverlap = 200,

		// Fine-tune clone final position - horizontal offset in pixels
		cloneOffsetX = 0,

		// Fine-tune clone final position - vertical offset in pixels
		cloneOffsetY = 0,

		// Multiply letter spacing by this factor to adjust bunching
		cloneSpacingMultiplier = 1.12
	} = $props();

	const FULL = 'Social Computations & Interacting Minds Research Studio';
	const ACR = 'SciMinds'; // case-sensitive display

	// Per-letter adjustments for fine-tuning animation
	const letterAdjustments = [
		undefined, // S
		undefined, // c
		{ endX: -5 }, // i
		{ endX: -3 }, // M
		{ endX: 3 }, // i
		undefined, // n
		undefined, // d
		undefined // s
	];

	// Source character indices: which character from FULL text to use for each acronym letter
	const letterSourceIndices = [
		0, // S -> first 'S' in "Social"
		7, // c
		20, // i
		30, // M -> first 'M' in "Minds"
		33, // i
		35, // n
		37, // d
		42 // s
	];

	// Default values for letter adjustments
	const defaultAdjustment = {
		startScale: 0.5,
		endScale: 1.0,
		startX: 0,
		endX: 0,
		startY: 0,
		endY: 0
	};

	// State
	let stage = $state();
	let fullEl = $state();
	let acrEl = $state();
	let isReady = $state(false);
	let hideFullText = $state(false);
	let showAcronym = $state(false);
	let fadeClones = $state(false);
	let clones = $state([]);
	let visibleCloneIndices = $state(new Set()); // Track which clone indices should be visible
	let cloneTimeouts = $state([]); // Store timeout IDs for cleanup
	let resizeObserver = $state(null);
	let stabilityCheckInterval = $state(null);

	// Simple splitter for template injection
	const split = (s) => [...s].map((ch, i) => ({ ch, i }));

	// Split text into words while preserving spaces for proper wrapping
	const splitIntoWords = (text) => {
		const words = [];
		let currentWord = [];
		let charIndex = 0;

		for (let i = 0; i < text.length; i++) {
			const ch = text[i];
			if (ch === ' ') {
				if (currentWord.length > 0) {
					words.push({ chars: currentWord, isSpace: false });
					currentWord = [];
				}
				words.push({
					chars: [{ ch: ' ', i: charIndex }],
					isSpace: true
				});
				charIndex++;
			} else {
				currentWord.push({ ch, i: charIndex });
				charIndex++;
			}
		}
		if (currentWord.length > 0) {
			words.push({ chars: currentWord, isSpace: false });
		}
		return words;
	};

	/**
	 * Wait for layout to stabilize by checking if element positions stop changing
	 * Returns a promise that resolves when layout is stable
	 */
	async function waitForLayoutStability() {
		return new Promise((resolve) => {
			if (!fullEl || !acrEl || !stage) {
				resolve();
				return;
			}

			let stableCount = 0;
			const STABILITY_THRESHOLD = 3; // Must be stable for 3 consecutive frames
			const POSITION_THRESHOLD = 1; // Position change tolerance in pixels
			let lastPositions = null;

			const checkStability = () => {
				const fullRect = fullEl.getBoundingClientRect();
				const acrRect = acrEl.getBoundingClientRect();
				const stageRect = stage.getBoundingClientRect();

				// Check if elements have valid dimensions
				if (
					fullRect.width === 0 ||
					fullRect.height === 0 ||
					acrRect.width === 0 ||
					acrRect.height === 0 ||
					stageRect.width === 0 ||
					stageRect.height === 0
				) {
					// Elements not ready yet, keep checking
					requestAnimationFrame(checkStability);
					return;
				}

				// First measurement - store positions
				if (lastPositions === null) {
					lastPositions = {
						full: { top: fullRect.top, left: fullRect.left, width: fullRect.width },
						acr: { top: acrRect.top, left: acrRect.left, width: acrRect.width },
						stage: { top: stageRect.top, left: stageRect.left }
					};
					requestAnimationFrame(checkStability);
					return;
				}

				// Check if positions changed significantly
				const fullChanged =
					Math.abs(fullRect.top - lastPositions.full.top) > POSITION_THRESHOLD ||
					Math.abs(fullRect.left - lastPositions.full.left) > POSITION_THRESHOLD ||
					Math.abs(fullRect.width - lastPositions.full.width) > POSITION_THRESHOLD;

				const acrChanged =
					Math.abs(acrRect.top - lastPositions.acr.top) > POSITION_THRESHOLD ||
					Math.abs(acrRect.left - lastPositions.acr.left) > POSITION_THRESHOLD ||
					Math.abs(acrRect.width - lastPositions.acr.width) > POSITION_THRESHOLD;

				if (!fullChanged && !acrChanged) {
					stableCount++;
					if (stableCount >= STABILITY_THRESHOLD) {
						// Layout is stable!
						resolve();
						return;
					}
				} else {
					// Positions changed, reset stability counter
					stableCount = 0;
					lastPositions = {
						full: { top: fullRect.top, left: fullRect.left, width: fullRect.width },
						acr: { top: acrRect.top, left: acrRect.left, width: acrRect.width },
						stage: { top: stageRect.top, left: stageRect.left }
					};
				}

				requestAnimationFrame(checkStability);
			};

			// Start checking
			checkStability();
		});
	}

	/**
	 * Initialize the animation after layout is stable
	 */
	async function initializeAnimation() {
		// Reset state IMMEDIATELY (before any async operations)
		isReady = false;
		hideFullText = false;
		showAcronym = false;
		fadeClones = false;
		clones = [];
		visibleCloneIndices = new Set();

		// Clear any existing clone timeouts
		cloneTimeouts.forEach((timeoutId) => {
			if (timeoutId) clearTimeout(timeoutId);
		});
		cloneTimeouts = [];

		if (!fullEl || !acrEl || !stage) return;

		// Check for reduced motion preference IMMEDIATELY (before any async operations)
		// This prevents any flash of clones when reduced motion is enabled
		const reduce =
			!forceAnimation && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

		// If reduced motion, skip all async operations and show acronym immediately
		if (reduce) {
			isReady = true;
			showAcronym = true;
			clones = [];
			visibleCloneIndices = new Set();
			cloneTimeouts = [];
			return;
		}

		// Step 1: Wait for fonts to load
		if (document.fonts && document.fonts.ready) {
			await document.fonts.ready;
		}

		// Step 2: Wait for DOM to be ready
		await tick();
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

		// Step 3: Wait for layout to stabilize
		await waitForLayoutStability();

		// Step 4: Now measure positions (layout is stable, reduced motion check passed)
		// Collect character spans
		const fullChars = Array.from(fullEl.querySelectorAll('[data-ch]'));
		const acrChars = Array.from(acrEl.querySelectorAll('[data-ch]'));

		if (fullChars.length === 0 || acrChars.length === 0) {
			// Elements not ready, skip animation
			return;
		}

		// Map acronym letters to source letters in full text
		const used = new SvelteSet();
		const pairs = [];
		acrChars.forEach((dst, acrIdx) => {
			const t = dst.dataset.ch;
			let srcIdx;

			if (letterSourceIndices[acrIdx] !== undefined) {
				srcIdx = letterSourceIndices[acrIdx];
			} else {
				srcIdx = fullChars.findIndex(
					(el, idx) => !used.has(idx) && el.dataset.ch.toLowerCase() === t.toLowerCase()
				);
				if (srcIdx === -1)
					srcIdx = fullChars.findIndex((el, idx) => !used.has(idx) && el.dataset.ch !== ' ');
			}

			used.add(srcIdx);
			pairs.push({ src: fullChars[srcIdx], dst, ch: dst.dataset.ch });
		});

		// Measure positions (layout is now stable)
		const sRect = stage.getBoundingClientRect();

		// Reset visible clone indices - start with none visible
		visibleCloneIndices = new Set();
		cloneTimeouts = [];

		clones = pairs.map(({ src, dst, ch }, idx) => {
			const a = src.getBoundingClientRect();
			const b = dst.getBoundingClientRect();
			const dstStyle = window.getComputedStyle(dst);

			const adj = letterAdjustments[idx] || {};
			const startScale = adj.startScale ?? defaultAdjustment.startScale;
			const endScale = adj.endScale ?? defaultAdjustment.endScale;
			const startX = adj.startX ?? defaultAdjustment.startX;
			const endX = adj.endX ?? defaultAdjustment.endX;
			const startY = adj.startY ?? defaultAdjustment.startY;
			const endY = adj.endY ?? defaultAdjustment.endY;

			// Calculate base displacement
			let dx = b.left - a.left;
			let dy = b.top - a.top;

			// Apply spacing multiplier
			if (cloneSpacingMultiplier !== 1.0) {
				const centerIdx = (pairs.length - 1) / 2;
				const offsetFromCenter = idx - centerIdx;
				dx += offsetFromCenter * b.width * (cloneSpacingMultiplier - 1.0);
			}

			// Apply manual offsets
			dx += cloneOffsetX;
			dy += cloneOffsetY;
			dx += endX;
			dy += endY;

			return {
				ch,
				left: a.left - sRect.left + startX,
				top: a.top - sRect.top + startY,
				dx,
				dy,
				w: b.width,
				h: b.height,
				fontSize: dstStyle.fontSize,
				lineHeight: dstStyle.lineHeight,
				fontWeight: dstStyle.fontWeight,
				letterSpacing: dstStyle.letterSpacing,
				startScale,
				endScale
			};
		});

		// Trigger initial reveal
		isReady = true;

		// Schedule each clone to appear at its animation delay time
		clones.forEach((_, idx) => {
			const delay = baseDelay + idx * staggerDelay;
			const timeoutId = setTimeout(() => {
				visibleCloneIndices = new Set([...visibleCloneIndices, idx]);
			}, delay);
			cloneTimeouts.push(timeoutId);
		});

		// Calculate timing for clone animations
		const lastCloneLanding = baseDelay + (clones.length - 1) * staggerDelay + animationDuration;
		const cloneFadeStart = lastCloneLanding + acronymTransitionDelay;
		const acronymAppearTime = cloneFadeStart + cloneFadeDuration - transitionOverlap;

		setTimeout(() => {
			fadeClones = true;
		}, cloneFadeStart);

		setTimeout(() => {
			showAcronym = true;
		}, acronymAppearTime);

		if (hideFullTextAfterAnimation) {
			setTimeout(() => {
				hideFullText = true;
			}, acronymAppearTime);
		}
	}

	// Initialize on mount
	onMount(() => {
		initializeAnimation();

		// Cleanup function
		return () => {
			// Clear clone timeouts
			cloneTimeouts.forEach((timeoutId) => {
				if (timeoutId) clearTimeout(timeoutId);
			});
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
			if (stabilityCheckInterval) {
				clearInterval(stabilityCheckInterval);
			}
		};
	});

	// Reset animation when navigating to home page
	$effect(() => {
		if ($page.url.pathname === '/' && fullEl && acrEl && stage) {
			// Reset state IMMEDIATELY (no delay) to prevent any flash
			clones = [];
			visibleCloneIndices = new Set();
			cloneTimeouts.forEach((timeoutId) => {
				if (timeoutId) clearTimeout(timeoutId);
			});
			cloneTimeouts = [];

			// Then initialize animation
			initializeAnimation();
		}
	});
</script>

<!-- CONTAINER STYLING: Customize spacing, max-width, padding -->
<section
	bind:this={stage}
	data-ready={isReady}
	data-force-animation={forceAnimation}
	class="relative mx-auto max-w-5xl px-6 py-0"
	style="contain: layout;"
>
	<!-- FULL TEXT STYLING: Customize size, weight, spacing, color -->
	<h1
		class="text-center leading-relaxed font-semibold tracking-tighter text-balance wrap-break-word"
		style="font-size: clamp(1.5rem, 4vw, 1.875rem);"
	>
		<span
			bind:this={fullEl}
			class="inline-block transition-opacity duration-300 ease-out"
			class:opacity-0={!isReady || hideFullText}
			class:opacity-100={isReady && !hideFullText}
			aria-label={FULL}
		>
			{#each splitIntoWords(FULL) as word, wordIdx (wordIdx)}
				<span class="inline-block whitespace-nowrap">
					{#each word.chars as { ch, i } (i)}
						<span
							data-ch={ch === ' ' ? ' ' : ch}
							class="inline-block will-change-transform select-none"
							style="--stagger:{i * characterStagger}ms">{ch === ' ' ? '\u00A0' : ch}</span
						>
					{/each}
				</span>
			{/each}
		</span>
	</h1>

	<!-- ACRONYM STYLING: Customize size, weight, letter spacing, color -->
	<div class="mt-6 text-center">
		<h2 class="text-primary" style="font-size: clamp(1.875rem, 8vw, 3.75rem);">
			<span
				bind:this={acrEl}
				class="inline-block transition-opacity duration-500 ease-out"
				class:opacity-0={!showAcronym}
				class:opacity-100={showAcronym}
				aria-label={ACR}
			>
				{#each split(ACR) as { ch, i } (i)}
					<span data-ch={ch} class="inline-block will-change-transform select-none">{ch}</span>
				{/each}
			</span>
		</h2>
	</div>

	<!-- ANIMATED CLONES: Customize color, effects (glow, shadow, etc.) -->
	{#if clones.length}
		{#each clones as c, i (i)}
			{#if visibleCloneIndices.has(i)}
				<span
					aria-hidden="true"
					class="clone animate-pluck pointer-events-none absolute"
					class:fade-out={fadeClones}
					style="
						left:{c.left}px; top:{c.top}px; width:{c.w}px; height:{c.h}px;
						font-size:{c.fontSize}; line-height:{c.lineHeight};
						font-weight:{c.fontWeight}; letter-spacing:{c.letterSpacing};
						--dx:{c.dx}px; --dy:{c.dy}px; --i:{i};
						--start-scale:{c.startScale}; --end-scale:{c.endScale};
						--delay:0ms;
						--fade-duration:{cloneFadeDuration}ms;
						animation-duration: {animationDuration}ms;
						color: var(--color-{accentColor});
					">{c.ch}</span
				>
			{/if}
		{/each}
	{/if}
</section>

<style>
	/* CLONE BASE STYLING: Customize appearance of flying letters */
	.clone {
		display: inline-block;
		text-align: center;
		will-change: transform, opacity, filter;
		transform: translate(0, 0) scale(var(--start-scale, 0.5));
		opacity: 0;
		animation-delay: var(--delay, 0ms);
	}

	/* CLONE FADE-OUT: Triggered when all clones have landed */
	.clone.fade-out {
		opacity: 0 !important;
		transition: opacity var(--fade-duration, 300ms) ease-out !important;
	}

	/* CSS-only pluck keyframes using custom properties */
	@keyframes pluck {
		0% {
			transform: translate(0px, 0px) scale(var(--start-scale, 0.5));
			opacity: 1;
			filter: blur(0px);
		}
		60% {
			transform: translate(calc(var(--dx) * 0.9), calc(var(--dy) * 0.9))
				scale(calc(var(--start-scale, 0.5) + (var(--end-scale, 1) - var(--start-scale, 0.5)) * 0.6));
		}
		100% {
			transform: translate(var(--dx), var(--dy)) scale(var(--end-scale, 1));
			opacity: 1;
			filter: blur(0px);
		}
	}

	.animate-pluck {
		animation-name: pluck;
		animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
		animation-fill-mode: forwards;
	}

	/* Stagger animation for initial text appearance */
	[data-ch] {
		animation: fadeUp 380ms ease-out both;
		animation-delay: var(--stagger, 0ms);
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(0);
			filter: blur(0);
		}
		to {
			opacity: 1;
			transform: translateY(0);
			filter: blur(0);
		}
	}

	/* Respect reduced motion preferences (unless forceAnimation is true) */
	@media (prefers-reduced-motion: reduce) {
		section:not([data-force-animation='true']) .animate-pluck,
		section:not([data-force-animation='true']) [data-ch] {
			animation: none !important;
		}
	}
</style>
