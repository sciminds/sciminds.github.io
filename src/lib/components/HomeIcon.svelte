<script>
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	// Check if we're on the home page
	const isHome = $derived($page.url.pathname === '/');
</script>

{#if !isHome}
	<a
		href={resolve('/')}
		data-sveltekit-preload-data
		class="absolute top-3 right-12 m-0 p-0 transition-colors hover:cursor-pointer hover:text-primary sm:top-6 sm:right-16 lg:top-8 lg:right-20"
		aria-label="Go to home page"
	>
		<!-- Home icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="h-6 w-6"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
			/>
		</svg>
	</a>
{/if}
