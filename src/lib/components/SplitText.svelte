<!--
  SplitTextGSAP - Animated text component using GSAP
  Moves letters from full name to spell an acronym using GSAP Timeline
-->

<script>
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { gsap } from 'gsap';
	import { SplitText } from 'gsap/SplitText';

	gsap.registerPlugin(SplitText);

	// Props with defaults (matching current component)
	let {
		// Delay between each letter animation (seconds for GSAP)
		staggerDelay = 0.2,

		// How long each letter takes to fly (seconds)
		animationDuration = 0.25,

		// Delay for initial text appearance (seconds)
		characterStagger = 0.04,

		// Delay before clone animations start (seconds)
		baseDelay = 0.4,

		// Hide full text after animation completes
		hideFullTextAfterAnimation = false,

		// Semantic color for flying letters
		accentColor = 'primary',

		// Force animation to play even if user prefers reduced motion
		forceAnimation = true,

		// Delay between last clone landing and starting the transition (seconds)
		acronymTransitionDelay = 0.5,

		// How fast clones fade out (seconds)
		cloneFadeDuration = 0.0,

		// Overlap between clone fade-out and acronym fade-in (seconds)
		transitionOverlap = 0.5,

		// Fine-tune clone final position - horizontal offset in pixels
		cloneOffsetX = 0,

		// Fine-tune clone final position - vertical offset in pixels
		cloneOffsetY = 0,

		// Multiply letter spacing by this factor to adjust bunching
		cloneSpacingMultiplier = 1
	} = $props();

	const FULL = 'Social Computations & Interacting Minds Research Studio';
	const ACR = 'SciMinds';

	// Split text into words for proper wrapping (preserves word boundaries)
	// Returns array of { text, isSpace } objects
	// Spaces are replaced with non-breaking spaces (\u00A0) to prevent collapse between inline-block elements
	function splitIntoWords(text) {
		const result = [];
		const parts = text.split(/(\s+)/);

		for (const part of parts) {
			if (part.length > 0) {
				const isSpace = /^\s+$/.test(part);
				result.push({
					text: isSpace ? part.replace(/ /g, '\u00A0') : part,
					isSpace
				});
			}
		}

		return result;
	}

	// Per-letter adjustments for fine-tuning animation
	const letterAdjustments = [
		undefined, // S
		undefined, // c
		undefined, // i
		undefined, // M
		undefined, // i
		undefined, // n
		undefined, // d
		undefined // s
	];

	// Source character indices: which character from FULL text to use for each acronym letter
	// Note: SplitText splits EVERY character including spaces, so indices must account for spaces
	// Full text: "Social Computations & Interacting Minds Research Studio"
	// DOM indices after SplitText (includes spaces): "Minds" is at [30,31,32,33,34]
	const letterSourceIndices = [
		0, // S -> first 'S' in "Social"
		2, // c -> from "Social"
		3, // i -> from "Social"
		30, // M -> first 'M' in "Minds" (DOM index, not string index)
		31, // i -> from "Minds"
		32, // n -> from "Minds"
		33, // d -> from "Minds"
		34 // s -> from "Minds"
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
	let stageEl = $state();
	let fullEl = $state();
	let acrEl = $state();
	let timeline = $state(null);
	let sourceSplit = $state(null);
	let targetSplit = $state(null);
	let isInitializing = $state(false);

	async function initAnimation() {
		// Prevent multiple simultaneous calls
		if (isInitializing) return;
		isInitializing = true;
		// Reset any existing animation
		if (timeline) {
			timeline.kill();
			timeline = null;
		}
		if (sourceSplit) {
			sourceSplit.revert();
			sourceSplit = null;
		}
		if (targetSplit) {
			targetSplit.revert();
			targetSplit = null;
		}

		if (!fullEl || !acrEl || !stageEl) {
			isInitializing = false;
			return;
		}

		// Check reduced motion preference
		const reduce =
			!forceAnimation && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

		if (reduce) {
			// Skip animation, show acronym immediately
			gsap.set(acrEl, { opacity: 1 });
			isInitializing = false;
			return;
		}

		// Wait for fonts and layout
		if (document.fonts && document.fonts.ready) {
			await document.fonts.ready;
		}
		await tick();
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

		// Split text using GSAP SplitText plugin
		// Use 'chars,words' to preserve word boundaries for proper wrapping
		sourceSplit = new SplitText(fullEl, { type: 'chars,words' });
		targetSplit = new SplitText(acrEl, { type: 'chars' });

		// Flatten chars array (chars may be nested within words)
		// For 'chars,words' type, GSAP creates words[] with nested chars
		// We need to flatten all character elements in order
		let sourceChars = [];
		if (sourceSplit.chars && sourceSplit.chars.length > 0) {
			// If chars are already flattened, use them
			sourceChars = sourceSplit.chars;
		} else if (sourceSplit.words && sourceSplit.words.length > 0) {
			// Otherwise, flatten from words
			sourceChars = sourceSplit.words.flatMap((word) => {
				// Each word element contains character elements as children
				return Array.from(word.children || []);
			});
		}

		// Measure positions
		const stageRect = stageEl.getBoundingClientRect();
		const sourcePositions = sourceChars.map((el) => {
			const rect = el.getBoundingClientRect();
			return {
				x: rect.left - stageRect.left,
				y: rect.top - stageRect.top,
				width: rect.width,
				height: rect.height
			};
		});

		const targetPositions = targetSplit.chars.map((el) => {
			const rect = el.getBoundingClientRect();
			const style = window.getComputedStyle(el);
			return {
				x: rect.left - stageRect.left,
				y: rect.top - stageRect.top,
				width: rect.width,
				height: rect.height,
				fontSize: style.fontSize,
				lineHeight: style.lineHeight,
				fontWeight: style.fontWeight,
				letterSpacing: style.letterSpacing
			};
		});

		// Create GSAP timeline
		timeline = gsap.timeline();

		// Step 1: Fade in full text (staggered)
		timeline.from(sourceChars, {
			opacity: 0,
			duration: 0.38,
			stagger: characterStagger,
			ease: 'power2.out'
		});

		// Step 2: Create clones and animate them
		const clones = [];
		letterSourceIndices.forEach((srcIdx, acrIdx) => {
			const sourceChar = sourceChars[srcIdx];
			const adj = letterAdjustments[acrIdx] || {};
			const startScale = adj.startScale ?? defaultAdjustment.startScale;
			const endScale = adj.endScale ?? defaultAdjustment.endScale;
			const startX = adj.startX ?? defaultAdjustment.startX;
			const endX = adj.endX ?? defaultAdjustment.endX;
			const startY = adj.startY ?? defaultAdjustment.startY;
			const endY = adj.endY ?? defaultAdjustment.endY;

			// Create clone at source position
			const clone = sourceChar.cloneNode(true);
			clone.style.position = 'absolute';
			clone.style.left = sourcePositions[srcIdx].x + startX + 'px';
			clone.style.top = sourcePositions[srcIdx].y + startY + 'px';
			clone.style.color = `var(--color-${accentColor})`;
			clone.style.pointerEvents = 'none';
			clone.setAttribute('aria-hidden', 'true');

			// Apply target styling to clone
			const targetStyle = targetPositions[acrIdx];
			clone.style.fontSize = targetStyle.fontSize;
			clone.style.lineHeight = targetStyle.lineHeight;
			clone.style.fontWeight = targetStyle.fontWeight;
			clone.style.letterSpacing = targetStyle.letterSpacing;

			// Direct DOM manipulation required for GSAP clone animations
			// eslint-disable-next-line svelte/no-dom-manipulating
			stageEl.appendChild(clone);
			clones.push(clone);

			// Calculate delta (GSAP will handle the transform)
			let dx = targetPositions[acrIdx].x - sourcePositions[srcIdx].x;
			let dy = targetPositions[acrIdx].y - sourcePositions[srcIdx].y;

			// Apply spacing multiplier
			if (cloneSpacingMultiplier !== 1.0) {
				const centerIdx = (letterSourceIndices.length - 1) / 2;
				const offsetFromCenter = acrIdx - centerIdx;
				dx += offsetFromCenter * targetStyle.width * (cloneSpacingMultiplier - 1.0);
			}

			// Apply manual offsets
			dx += cloneOffsetX;
			dy += cloneOffsetY;
			dx += endX;
			dy += endY;

			// GSAP handles: transform application, timing, easing, cleanup
			timeline.fromTo(
				clone,
				{ opacity: 0, scale: startScale, x: 0, y: 0 },
				{
					opacity: 1,
					x: dx,
					y: dy,
					scale: endScale,
					duration: animationDuration,
					ease: 'power2.out'
				},
				baseDelay + acrIdx * staggerDelay
			);
		});

		// Step 3: Fade out clones and fade in acronym
		const lastCloneTime =
			baseDelay + (letterSourceIndices.length - 1) * staggerDelay + animationDuration;
		const cloneFadeStart = lastCloneTime + acronymTransitionDelay;
		const acronymAppearTime = cloneFadeStart + cloneFadeDuration - transitionOverlap;

		timeline.to(
			clones,
			{
				opacity: 0,
				duration: cloneFadeDuration,
				ease: 'power2.out'
			},
			cloneFadeStart
		);

		timeline.to(
			acrEl,
			{
				opacity: 1,
				duration: 0.5,
				ease: 'power2.out'
			},
			acronymAppearTime
		);

		// Cleanup clones
		timeline.call(
			() => {
				clones.forEach((clone) => clone.remove());
			},
			null,
			cloneFadeStart + cloneFadeDuration
		);

		// Hide full text if requested
		if (hideFullTextAfterAnimation) {
			timeline.to(
				fullEl,
				{
					opacity: 0,
					duration: 0.3,
					ease: 'power2.out'
				},
				acronymAppearTime
			);
		}

		isInitializing = false;
	}

	onMount(() => {
		initAnimation();

		return () => {
			if (timeline) timeline.kill();
			if (sourceSplit) sourceSplit.revert();
			if (targetSplit) targetSplit.revert();
		};
	});

	// Reset animation when navigating to home page
	$effect(() => {
		// Only run if on home page, elements are ready, and not already initializing
		if ($page.url.pathname === '/' && stageEl && fullEl && acrEl && !isInitializing && !timeline) {
			initAnimation();
		}
	});
</script>

<section bind:this={stageEl} class="relative mx-auto max-w-5xl px-6 py-0" style="contain: layout;">
	<!-- FULL TEXT STYLING: Customize size, weight, spacing, color -->
	<h1
		class="text-center leading-relaxed font-semibold tracking-tighter"
		style="font-size: clamp(1.5rem, 4vw, 1.875rem);"
	>
		<span bind:this={fullEl} class="inline-block" aria-label={FULL}>
			{#each splitIntoWords(FULL) as part, idx (idx)}
				{part.text}
			{/each}
		</span>
	</h1>

	<!-- ACRONYM STYLING: Customize size, weight, letter spacing, color -->
	<div class="mt-6 text-center font-medium">
		<h2 class="text-primary" style="font-size: clamp(1.875rem, 8vw, 3.75rem);">
			<span bind:this={acrEl} class="inline-block opacity-0" aria-label={ACR}>
				{ACR}
			</span>
		</h2>
	</div>
</section>
