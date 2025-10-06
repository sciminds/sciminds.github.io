<script>
	let searchQuery = $state('');
	let inputRef;

	// Debounce helper function
	function debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	// Process search with debouncing
	let processedQuery = $state('');
	const updateSearch = debounce((value) => {
		processedQuery = value.toLowerCase().trim();
	}, 200);

	$effect(() => {
		updateSearch(searchQuery);
	});

	// Extract text content from elements for searching
	function extractText(element) {
		if (!element) return '';
		// Get all text content, normalize whitespace
		return element.textContent.toLowerCase().replace(/\s+/g, ' ').trim();
	}

	// Filter publications based on search
	$effect(() => {
		if (typeof document === 'undefined') return;

		const sections = document.querySelectorAll('h2');
		let hasAnyResults = false;

		sections.forEach((section) => {
			// Get all siblings until next h2
			const publications = [];
			let sibling = section.nextElementSibling;
			while (sibling && sibling.tagName !== 'H2') {
				if (sibling.tagName === 'P') {
					publications.push(sibling);
				}
				sibling = sibling.nextElementSibling;
			}

			// Check each publication
			let sectionHasResults = false;
			publications.forEach((pub) => {
				const text = extractText(pub);
				const matches = !processedQuery || text.includes(processedQuery);

				if (matches) {
					pub.style.display = '';
					sectionHasResults = true;
					hasAnyResults = true;
				} else {
					pub.style.display = 'none';
				}
			});

			// Hide/show section headers based on results
			if (!processedQuery) {
				section.style.display = '';
			} else {
				section.style.display = sectionHasResults ? '' : 'none';
			}
		});

		// Show/hide no results message
		const noResultsEl = document.getElementById('no-results-message');
		if (noResultsEl) {
			noResultsEl.style.display = processedQuery && !hasAnyResults ? 'block' : 'none';
		}
	});

	// Clear search
	function clearSearch() {
		searchQuery = '';
		inputRef?.focus();
	}

	// Get result count for accessibility
	let resultCount = $derived.by(() => {
		if (typeof document === 'undefined' || !processedQuery) return -1;

		const visiblePubs = document.querySelectorAll('p:not([style*="display: none"])');
		return Array.from(visiblePubs).filter((p) => {
			// Filter to only publication paragraphs (those with content)
			const text = p.textContent.trim();
			return text && !p.id?.includes('no-results');
		}).length;
	});
</script>

<div class="my-4 md:mx-auto md:w-3/4">
	<div class="relative flex items-center">
		<input
			bind:this={inputRef}
			bind:value={searchQuery}
			type="search"
			placeholder="Search publications..."
			class="h-12 w-full rounded-md border border-zinc-300 bg-zinc-200/50 py-3 pr-12 pl-12
			       text-base placeholder-zinc-400 transition-all duration-200
			       focus:border-primary focus:placeholder-zinc-600 focus:ring-2
			       focus:ring-primary/20 focus:outline-none
			       dark:border-zinc-600 dark:bg-zinc-800 dark:placeholder-zinc-500 dark:focus:placeholder-zinc-400"
			aria-label="Search publications"
			aria-describedby={resultCount >= 0 ? 'search-results-count' : undefined}
		/>

		<!-- Search Icon -->
		<div class="pointer-events-none absolute left-0 flex h-full w-12 items-center justify-center">
			<svg
				class="h-5 w-5 text-zinc-400 dark:text-zinc-500"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
		</div>

		<!-- Clear Button -->
		{#if searchQuery}
			<button
				onclick={clearSearch}
				class="absolute right-0 flex h-full w-12 items-center justify-center
				       text-zinc-500 transition-colors duration-150 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
				aria-label="Clear search"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Search Results Count (for screen readers and visual feedback) -->
	{#if processedQuery && resultCount >= 0}
		<div id="search-results-count" class="text-base-content/60 mt-2 text-sm" aria-live="polite">
			{resultCount === 0
				? 'No publications found'
				: `Showing ${resultCount} publication${resultCount === 1 ? '' : 's'}`}
		</div>
	{/if}
</div>

<!-- No Results Message (hidden by default, shown via JavaScript) -->
<div
	id="no-results-message"
	class="border-error/30 bg-error/5 hidden rounded-lg border-0 p-6 text-center"
>
	<p class="text-error font-medium">
		No publications found matching "{searchQuery}"
	</p>
</div>

<style>
	/* Remove default search input clear button in Webkit browsers */
	input[type='search']::-webkit-search-cancel-button {
		-webkit-appearance: none;
	}
</style>
