<script>
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	const navItems = [
		{ name: 'Focus', href: '/focus' },
		{ name: 'Team', href: '/team' },
		{ name: 'Read', href: '/read' },
		{ name: 'Build', href: '/build' },
		{ name: 'Learn', href: '/learn' },
		{ name: 'Connect', href: '/connect' }
	];
</script>

<nav class="mb-6 text-xl font-light md:mb-6 md:text-2xl">
	<ul class="flex flex-wrap justify-center gap-x-6 gap-y-2">
		{#each navItems as item (item.href)}
			<li class="font-medium text-muted">
				<a
					href={resolve(item.href)}
					class="no-underline transition-colors hover:text-primary {$page.url.pathname === item.href
						? 'text-primary'
						: ''}"
				>
					{item.name}
				</a>
			</li>
		{/each}
	</ul>
</nav>
