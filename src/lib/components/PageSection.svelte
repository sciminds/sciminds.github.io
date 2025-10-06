<script>
	/**
	 * PageSection - Responsive wrapper component for consistent page layouts
	 *
	 * Provides three variants for different content types:
	 * - prose: Text-heavy content (articles, markdown)
	 * - wide: Mixed content with images/cards
	 * - full: Custom layouts that manage their own width
	 *
	 * @see /RESPONSIVE_PATTERNS.md for usage guide
	 *
	 * @typedef {Object} Props
	 * @property {'prose' | 'wide' | 'full'} [variant='prose'] - Layout variant controlling max-width
	 * @property {boolean} [padding=true] - Whether to apply horizontal padding
	 * @property {'section' | 'div' | 'main' | 'article' | 'aside'} [as='section'] - HTML element to render
	 * @property {string} [class] - Additional CSS classes to append
	 * @property {import('svelte').Snippet} children - Child content
	 */

	/**
	 * @type {Props}
	 */
	let {
		variant = 'prose',
		padding = true,
		as = 'section',
		class: className = '',
		children
	} = $props();

	/**
	 * Variant-specific max-width classes
	 */
	const variantClasses = $derived(
		{
			prose: 'max-w-prose md:max-w-4xl',
			wide: 'max-w-5xl lg:max-w-7xl',
			full: 'max-w-[90rem]'
		}[variant]
	);

	/**
	 * Responsive padding classes
	 */
	const paddingClasses = $derived(padding ? 'px-4 sm:px-6' : '');

	/**
	 * Combined classes
	 */
	const classes = $derived(`mx-auto ${variantClasses} ${paddingClasses} ${className}`.trim());
</script>

<svelte:element this={as} class={classes}>
	{@render children()}
</svelte:element>
