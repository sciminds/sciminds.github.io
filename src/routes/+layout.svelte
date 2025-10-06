<script>
	import '../fonts.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import HomeIcon from '$lib/components/HomeIcon.svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	// import TypeWriter from '$lib/components/TypeWriter.svelte'
	// import PublicationSearch from '$lib/components/PublicationSearch.svelte'

	let { children } = $props();

	// Check if we're on the home page
	const isHome = $derived($page.url.pathname === '/');

	// Homepage SEO
	const baseUrl = 'https://sciminds.ucsd.edu';
	const currentUrl = $derived(`${baseUrl}${$page.url.pathname}`);

	// Structured data JSON for homepage
	const structuredData = $derived(
		isHome
			? JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'ResearchOrganization',
					name: 'SciMinds',
					alternateName: 'Social Computations & Interacting Minds Research Studio',
					url: 'https://sciminds.ucsd.edu',
					logo: 'https://sciminds.ucsd.edu/logo.png',
					description:
						'Research studio studying social cognition, neuroscience, and computational approaches to understanding how people interact and share information.',
					parentOrganization: {
						'@type': 'CollegeOrUniversity',
						name: 'University of California San Diego',
						url: 'https://ucsd.edu'
					},
					department: {
						'@type': 'Organization',
						name: 'Department of Psychology',
						url: 'https://psychology.ucsd.edu'
					},
					address: {
						'@type': 'PostalAddress',
						addressLocality: 'San Diego',
						addressRegion: 'CA',
						addressCountry: 'US'
					}
				})
			: ''
	);

	//  Typewriter data
	// const scimindsExpansions = [
	// 	'The Science of Interacting Minds...',
	// 	'Scientific Investigation of Multi-Agent Interactive Dynamics...'
	// ];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if isHome}
		<title>SciMinds - Social Computations & Interacting Minds Research Studio</title>
		<meta
			name="description"
			content="SciMinds research studio at UC San Diego. We study computational social cognition & neuroscience and build tools & software to understand social interactions."
		/>

		<!-- Open Graph / Facebook -->
		<meta property="og:type" content="website" />
		<meta property="og:url" content={currentUrl} />
		<meta
			property="og:title"
			content="SciMinds - Social Computations & Interacting Minds Research Studio"
		/>
		<meta
			property="og:description"
			content="SciMinds research studio at UC San Diego. We study computational social cognition & neuroscience and build tools & software to understand social interactions."
		/>
		<meta property="og:image" content="{baseUrl}/og-image.jpg" />
		<meta property="og:site_name" content="SciMinds" />

		<!-- Twitter Card -->
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:url" content={currentUrl} />
		<meta
			name="twitter:title"
			content="SciMinds - Social Computations & Interacting Minds Research Studio"
		/>
		<meta
			name="twitter:description"
			content="SciMinds research studio at UC San Diego. We study computational social cognition & neuroscience and build tools & software to understand social interactions."
		/>
		<meta name="twitter:image" content="{baseUrl}/og-image.jpg" />

		<!-- Canonical URL -->
		<link rel="canonical" href={currentUrl} />

		<!-- Structured Data - Organization -->
		{#if structuredData}
			<svelte:element this={"script"} type="application/ld+json">
				{structuredData}
			</svelte:element>
		{/if}
	{/if}
</svelte:head>

<div class="flex min-h-screen flex-col justify-between p-4 md:py-6">
	<ThemeToggle />
	<HomeIcon />

	{#if isHome}
		<div class="my-auto pt-8 md:pt-16">
			<Header />
		</div>
	{:else}
		<nav class="mx-auto mt-8 w-full max-w-7xl">
			<Navigation />
		</nav>
	{/if}

	<main class="mb-auto md:mt-4">
		{@render children?.()}
	</main>

	<Footer />
</div>

<!-- Typewriter component -->
<!-- <div class="-mt-4 mb-2">
	<TypeWriter
		displayCursor={true}
		phrases={scimindsExpansions}
		initialDelay={0}
		typeSpeed={15}
		deleteSpeed={30}
		fadeSpeed={1000}
		deleteMode={'fade'}
		firstPhrasePauseDuration={2000}
		pauseDuration={2000}
		class={'italic'}
	/>
</div> -->
