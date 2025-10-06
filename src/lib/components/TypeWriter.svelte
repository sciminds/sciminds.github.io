<script>
	import { onMount, onDestroy } from 'svelte';

	// Props with defaults
	let {
		// Array of phrases to cycle through in the typewriter animation
		phrases = [],

		// Show blinking cursor?
		displayCursor = false,

		// Milliseconds to wait between typing each character (default: 50ms = ~20 chars/sec)
		typeSpeed = 50,

		// Milliseconds to wait between deleting each character (default: 30ms, faster than typing)
		// Only used when deleteMode='typewriter'
		deleteSpeed = 30,

		// Delete mode: "typewriter" (character-by-character), "fade" (opacity transition), or "none" (type once, no delete)
		deleteMode = 'typewriter',

		// Milliseconds for fade transition duration when deleteMode='fade' (default: 500ms)
		// Only used when deleteMode='fade'
		fadeSpeed = 500,

		// Milliseconds to pause after typing the first phrase before deleting (default: 4000ms)
		firstPhrasePauseDuration = 4000,

		// Milliseconds to pause after typing subsequent phrases before deleting (default: 2000ms)
		pauseDuration = 2000,

		// Milliseconds to wait before starting the animation (default: 500ms)
		initialDelay = 500,

		// If true, only delete characters that differ between phrases (smart backspace)
		// If false, delete entire phrase character-by-character (default: true)
		// Only used when deleteMode='typewriter'
		smartBackspace = true,

		// Emphasize first letters of major words (bold & colored)
		emphasizeFirstLetters = false,

		// Only emphasize letters in the first phrase (default: true)
		// If false, emphasize letters in all phrases
		emphasizeFirstPhraseOnly = true,

		// Words to skip when emphasizing (e.g., articles, conjunctions, prepositions)
		skipWords = ['&', 'of', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'],

		// Additional CSS classes to apply to the container
		class: className = '',

		// ARIA label for screen readers (default: first phrase)
		ariaLabel = phrases[0] || ''
	} = $props();

	// State
	let currentPhraseIndex = $state(0);
	let currentCharIndex = $state(0);
	let isDeleting = $state(false);
	let isPaused = $state(false);
	let isWaiting = $state(true);
	let displayText = $state('');
	let lastTimestamp = $state(0);
	let pauseStartTime = $state(0);
	let opacity = $state(1); // Track opacity for fade mode (1 = visible, 0 = invisible)
	let animationFrameId = null;

	/**
	 * Calculate common prefix length between two strings
	 * Used for smart backspace mode
	 */
	function getCommonPrefixLength(str1, str2) {
		let i = 0;
		const minLength = Math.min(str1.length, str2.length);
		while (i < minLength && str1[i] === str2[i]) {
			i++;
		}
		return i;
	}

	/**
	 * Process text to emphasize first letters of major words
	 * Wraps first letter of each significant word in a span with styling
	 */
	function processTextWithEmphasis(text) {
		if (!emphasizeFirstLetters || !text) return text;

		// Check if we should emphasize based on phrase index
		if (emphasizeFirstPhraseOnly && currentPhraseIndex !== 0) {
			return text;
		}

		const words = text.split(' ');
		const processedWords = words.map((word) => {
			if (!word) return word;

			// Check if word should be skipped
			// First check the original word, then check lowercase alpha-only version
			const wordLower = word.toLowerCase();
			const wordAlphaOnly = wordLower.replace(/[^a-z]/g, '');

			// Skip if the word itself is in skipWords (e.g., "&")
			if (
				skipWords.includes(word) ||
				skipWords.includes(wordLower) ||
				skipWords.includes(wordAlphaOnly)
			) {
				return word;
			}

			// Wrap first letter in span with emphasis styling
			const firstLetter = word.charAt(0);
			const restOfWord = word.slice(1);
			return `<span class="emphasized-letter font-extrabold text-primary">${firstLetter}</span>${restOfWord}`;
		});

		return processedWords.join(' ');
	}

	// Computed: processed display text with emphasis
	let processedDisplayText = $derived(processTextWithEmphasis(displayText));

	/**
	 * Main animation loop using requestAnimationFrame
	 */
	function animate(timestamp) {
		// Handle initial delay
		if (isWaiting) {
			if (timestamp - pauseStartTime >= initialDelay) {
				isWaiting = false;
				lastTimestamp = timestamp;
			}
			animationFrameId = requestAnimationFrame(animate);
			return;
		}

		const currentPhrase = phrases[currentPhraseIndex];
		const nextPhrase = phrases[(currentPhraseIndex + 1) % phrases.length];

		// Calculate elapsed time since last character change
		const elapsed = timestamp - lastTimestamp;

		if (isPaused) {
			// Handle pause after complete phrase
			// If deleteMode is 'none', stop the animation after typing
			if (deleteMode === 'none') {
				// Animation complete - don't schedule another frame
				return;
			}

			// Use longer pause for first phrase, shorter pause for subsequent phrases
			const currentPauseDuration =
				currentPhraseIndex === 0 ? firstPhrasePauseDuration : pauseDuration;

			if (elapsed >= currentPauseDuration) {
				isPaused = false;
				isDeleting = true;
				lastTimestamp = timestamp;
			}
		} else if (isDeleting) {
			if (deleteMode === 'typewriter') {
				// Typewriter mode: delete character-by-character
				const deleteTarget = smartBackspace ? getCommonPrefixLength(currentPhrase, nextPhrase) : 0;

				if (elapsed >= deleteSpeed && currentCharIndex > deleteTarget) {
					currentCharIndex--;
					displayText = currentPhrase.substring(0, currentCharIndex);
					lastTimestamp = timestamp;
				} else if (currentCharIndex === deleteTarget) {
					// Move to next phrase
					isDeleting = false;
					currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
					lastTimestamp = timestamp;
				}
			} else if (deleteMode === 'fade') {
				// Fade mode: fade out the entire phrase
				const fadeProgress = Math.min(elapsed / fadeSpeed, 1);
				opacity = 1 - fadeProgress;

				if (fadeProgress >= 1) {
					// Fade complete - reset for next phrase
					opacity = 1;
					currentCharIndex = 0;
					displayText = '';
					isDeleting = false;
					currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
					lastTimestamp = timestamp;
				}
			}
		} else {
			// Type characters from next phrase
			const targetPhrase = phrases[currentPhraseIndex];

			if (elapsed >= typeSpeed && currentCharIndex < targetPhrase.length) {
				currentCharIndex++;
				displayText = targetPhrase.substring(0, currentCharIndex);
				lastTimestamp = timestamp;
			} else if (currentCharIndex === targetPhrase.length) {
				// Pause before deleting
				isPaused = true;
				pauseStartTime = timestamp;
				lastTimestamp = timestamp;
			}
		}

		// Continue animation loop
		animationFrameId = requestAnimationFrame(animate);
	}

	// Start animation
	onMount(() => {
		if (phrases.length > 0) {
			pauseStartTime = performance.now();
			animationFrameId = requestAnimationFrame(animate);
		}
	});

	// Cleanup
	onDestroy(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<div
	class="typewriter-container {className}"
	class:first-phrase={currentPhraseIndex === 0 && emphasizeFirstLetters}
	aria-label={ariaLabel}
	style="opacity: {opacity}"
>
	<span aria-hidden="true">
		{#if emphasizeFirstLetters}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html processedDisplayText}
		{:else}
			{displayText}
		{/if}
	</span>
	{#if displayCursor && !isWaiting}
		<span aria-hidden="true" class="cursor"></span>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	/* Reserve space for the largest size to prevent layout shift */
	/* Mobile: Account for text wrapping over 3-4 lines for longest phrases */
	/* Tablet (sm:): Less wrapping, usually 2-3 lines max */
	/* Desktop (md:): Minimal wrapping, 1-2 lines */
	.typewriter-container {
		@apply mb-0 block text-center font-[inherit] text-zinc-500 will-change-contents;
		/* Reserve space for wrapped text: mobile (3-4 lines), tablet (2-3 lines), desktop (1-2 lines) */
		min-height: 6rem; /* ~96px for mobile - accounts for 3-4 wrapped lines */
		contain: layout; /* Isolate layout changes to prevent reflow */
	}

	/* Tablet: slightly less space needed */
	@media (min-width: 640px) {
		.typewriter-container {
			min-height: 5rem; /* ~80px for tablet - accounts for 2-3 wrapped lines */
		}
	}

	/* Desktop: minimal space needed */
	@media (min-width: 768px) {
		.typewriter-container {
			min-height: auto; /* Let content determine height on desktop */
		}
	}

	/* Special styling for first phrase */
	.typewriter-container.first-phrase {
		@apply text-xl font-semibold md:text-2xl;
	}

	.cursor {
		@apply ml-1 inline-block h-6 w-1 self-baseline bg-current align-baseline text-sky-500;
		animation: blink 1s step-end infinite;
	}

	/* Tailwind recommends keeping @keyframes in vanilla CSS */
	@keyframes blink {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}
</style>
