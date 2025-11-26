# Responsive Design Guide

Quick reference for responsive patterns used on the SciMinds website.

Core pattern to keep in mind: **design for mobile screens as the default, then apply tailwind modifiers to scale-up to larger screen sizes**

---

## Breakpoints

Handled by tailwind automatically using the `md:`, `lg:`, `xl:`, etc prefixes

| Width  | Name  | Device        |
| ------ | ----- | ------------- |
| 375px  | —     | Mobile        |
| 640px  | `sm`  | Large phone   |
| 768px  | `md`  | Tablet        |
| 1024px | `lg`  | Desktop       |
| 1536px | `2xl` | Large desktop |

**Test at all widths before committing changes.**

---

## PageSection Component

Wrapper for consistent page layouts. Import from `$lib/components/PageSection.svelte`.

| Variant | Max Width           | Use For                    |
| ------- | ------------------- | -------------------------- |
| `prose` | `max-w-prose → 4xl` | Text-heavy pages (default) |
| `wide`  | `max-w-5xl → 7xl`   | Mixed content, cards       |
| `full`  | `max-w-[90rem]`     | Custom layouts             |

```svelte
<PageSection variant="prose">
	<h1>Article Title</h1>
	<p>Content...</p>
</PageSection>
```

---

## Common Patterns

### Spacing (mobile-first, scale up)

```svelte
<!-- Padding -->
<div class="p-4 sm:p-6 lg:p-8">

<!-- Gap (always use gap with flex-wrap, NOT space-*) -->
<div class="flex flex-wrap gap-2 md:gap-4 lg:gap-6">

<!-- Margin -->
<section class="my-4 md:my-6 lg:my-8">
```

### Flex Layouts

```svelte
<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col gap-4 md:flex-row md:gap-8">
```

### Grid Layouts

```svelte
<!-- Responsive columns -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
```

### Typography

```svelte
<!-- Stepped sizing -->
<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">

<!-- Or fluid with clamp() in CSS -->
h1 { font-size: clamp(1.5rem, 5vw, 3rem); }
```

### Show/Hide by Breakpoint

```svelte
<div class="block md:hidden">Mobile only</div><div class="hidden md:block">Desktop only</div>
```

---

## Page-Specific Styles

Use `<style>` blocks with `@apply` for page-specific layouts. Always include `@reference "tailwindcss"`.

**Example from `/team`:**

```svelte
<style>
	@reference "tailwindcss";

	.team-member {
		@apply mb-4 flex flex-col items-center md:flex-row md:gap-8;
	}

	.avatar {
		@apply w-48 rounded-xl object-cover md:w-64;
	}
</style>
```

**Example from `/focus`:**

```svelte
<style>
	@reference "tailwindcss";

	p {
		@apply md:my-2;
	}
</style>
```

---

## Custom Utilities

Defined in `src/app.css`. Use these for consistency:

| Class            | Purpose                    |
| ---------------- | -------------------------- |
| `text-primary`   | Brand color (sky blue)     |
| `text-secondary` | Accent color (rose)        |
| `text-muted`     | Secondary text (auto dark) |
| `my-highlight`   | Gradient highlight effect  |
| `divider`        | Horizontal line            |
| `icon`           | Standard icon sizing       |
| `prose-custom`   | Markdown content styling   |

---

## Avoid These

```svelte
<!-- ❌ space-* breaks with flex-wrap -->
<div class="flex flex-wrap space-x-4">

<!-- ✅ Use gap instead -->
<div class="flex flex-wrap gap-4">
```

```svelte
<!-- ❌ Fixed pixels don't adapt -->
<div style="width: 400px;">

<!-- ✅ Responsive classes -->
<div class="w-full max-w-md">
```

```svelte
<!-- ❌ Desktop-first -->
<div class="grid grid-cols-3 md:grid-cols-1">

<!-- ✅ Mobile-first -->
<div class="grid grid-cols-1 md:grid-cols-3">
```

---

## Pre-Commit Checklist

- [ ] Test on mobile, desktop, and external-monitor screen sizes
- [ ] No horizontal scroll at any width
- [ ] Text readable (not too wide/small)
- [ ] Used `gap` instead of `space-*` for wrapping layouts
- [ ] Dark mode styles work correctly
