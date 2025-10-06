import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// build static site
		adapter: adapter()
	},
	preprocess: [
		mdsvex({
			layout: {
				_: join(__dirname, './src/lib/layouts/MdLayout.svelte')
			},
			rehypePlugins: [
				rehypeSlug, // Adds IDs to headings
				[
					rehypeAutolinkHeadings,
					{
						behavior: 'wrap', // Wraps the heading content in an anchor
						properties: {
							className: ['anchor-link'] // Add class for styling
						}
					}
				]
			]
		})
	],
	extensions: ['.svelte', '.svx']
};

export default config;
