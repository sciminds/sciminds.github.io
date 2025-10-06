<script>
	/**
	 * CallOut Component
	 *
	 * A reusable call-out block component with standardized styling.
	 * Used for highlighting important text/quotes across the website.
	 *
	 * Props:
	 * - content: The text content to display (required)
	 * - className: Additional CSS classes to apply to the container
	 * - justify: Whether to justify text on mobile (default: true)
	 * - width: Tailwind width classes to apply (default: 'w-full md:w-3/4')
	 *   Examples: 'w-[95%] md:w-3/4', 'w-full', 'w-4/5 md:w-2/3'
	 */
	let { content = '', className = '', justify = true, width = 'w-full md:w-3/4' } = $props();
</script>

<div class="callout-wrapper {width} {className}">
	<div class="callout-container not-prose">
		<p class="callout-content not-prose my-highlight {justify ? 'text-justify' : ''}">
			{content}
		</p>
	</div>
</div>

<style>
	@reference "tailwindcss";

	.callout-wrapper {
		@apply mx-auto my-4 flex md:mb-12;
	}

	.callout-container {
		@apply mx-auto rounded bg-slate-300/20 text-balance;
	}

	.callout-content {
		@apply rounded border-2 border-slate-400/20 px-2 py-1 text-center leading-snug font-medium hyphens-auto italic shadow-sm md:text-lg md:leading-relaxed md:shadow-md lg:text-xl md:px-3 md:py-2;
	}
</style>
