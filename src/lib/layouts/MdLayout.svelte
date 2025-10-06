<script>
	import { page } from '$app/stores';

	let {
		title,
		description = '',
		typography = true,
		layout = 'default',
		ogImage = null, // Open Graph image URL
		children
	} = $props();

	// Generate full URL for current page
	const baseUrl = 'https://sciminds.ucsd.edu';
	const currentUrl = $derived(`${baseUrl}${$page.url.pathname}`);

	// Generate Open Graph image URL if not provided
	const ogImageUrl = $derived(ogImage || `${baseUrl}/og-image.jpg`);

	// Build prose classes - simpler without dark mode detection
	const proseClasses = typography
		? 'prose prose-sm md:prose-base lg:prose-lg max-w-[65ch] md:max-w-[72ch] lg:max-w-[78ch] mx-auto prose-custom'
		: '';

	const layoutClass = layout === 'centered' || layout === 'home' ? 'text-center' : '';
</script>

<svelte:head>
	{#if title}
		<title>{title} | SciMinds</title>
		<meta name="description" content={description || title} />

		<!-- Open Graph / Facebook -->
		<meta property="og:type" content="website" />
		<meta property="og:url" content={currentUrl} />
		<meta property="og:title" content="{title} | SciMinds" />
		<meta property="og:description" content={description || title} />
		<meta property="og:image" content={ogImageUrl} />
		<meta property="og:site_name" content="SciMinds" />

		<!-- Twitter Card -->
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:url" content={currentUrl} />
		<meta name="twitter:title" content="{title} | SciMinds" />
		<meta name="twitter:description" content={description || title} />
		<meta name="twitter:image" content={ogImageUrl} />

		<!-- Canonical URL -->
		<link rel="canonical" href={currentUrl} />
	{/if}
</svelte:head>

<article class="{proseClasses} {layoutClass}">
	<div class="page-content">
		{@render children?.()}
	</div>
</article>

<style lang="postcss">
	@reference "tailwindcss";

	article {
		@apply animate-[fadeIn_0.5s_ease-in-out];
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
