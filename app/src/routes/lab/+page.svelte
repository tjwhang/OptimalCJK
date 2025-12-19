<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { base } from '$app/paths';
	import { typographySettings } from '$lib/stores';
	import { SAMPLE_TEXTS, FONTS } from '$lib/constants';

	let contentElement: HTMLElement;
	let showOptimizationEffect = false;

	// Subscribe to store
	let settings = $typographySettings;

	// Update store when local settings change
	$: typographySettings.set(settings);

	// Load content based on language
	$: currentText = SAMPLE_TEXTS[settings.language] || SAMPLE_TEXTS['English'];

	// Determine available fonts based on language group
	$: isCJK = ['Chinese', 'Japanese', 'Korean'].includes(settings.language);
	$: availableFonts = isCJK ? FONTS.CJK : FONTS.Latin;

	// Ensure font family is valid for current language
	$: {
		const validFonts = availableFonts.map((f) => f.value);
		if (!validFonts.includes(settings.fontFamily)) {
			settings.fontFamily = availableFonts[0].value;
		}
	}

	function applyPreset() {
		showOptimizationEffect = true;

		const preset = currentText.presets;
		if (preset) {
			settings.lineHeight = preset.lineHeight;
			settings.letterSpacing = preset.letterSpacing;
			settings.fontWeight = preset.fontWeight;
			settings.fontSize = preset.fontSize;
		}

		setTimeout(() => {
			showOptimizationEffect = false;
		}, 800);
	}
</script>

<svelte:head>
	<title>Typography Lab</title>
</svelte:head>

<div class="lab-container" in:fade>
	<header>
		<a href="{base}/" class="back-link">← 돌아가기</a>
		<h1 class="page-title">타이포그래피 실험실</h1>
	</header>

	<main>
		<div class="paper-wrapper">
			<div
				class="paper-card content-area"
				style:font-family={settings.fontFamily}
				style:font-weight={settings.fontWeight}
				style:line-height={settings.lineHeight}
				style:letter-spacing="{settings.letterSpacing}em"
				style:font-size="{settings.fontSize}px"
			>
				{#if showOptimizationEffect}
					<div class="optimization-flash" out:fade></div>
				{/if}

				<h1 contenteditable="true" bind:textContent={currentText.title} spellcheck="false">
					{currentText.title}
				</h1>
				<p contenteditable="true" bind:innerHTML={currentText.content} spellcheck="false"></p>
			</div>
		</div>

		<aside class="controls-panel">
			<div class="control-group">
				<label for="language">언어</label>
				<select id="language" bind:value={settings.language}>
					{#each Object.keys(SAMPLE_TEXTS) as lang}
						<option value={lang}>{SAMPLE_TEXTS[lang].label}</option>
					{/each}
				</select>
			</div>

			<div class="control-group">
				<label for="font">글꼴</label>
				<select id="font" bind:value={settings.fontFamily}>
					{#each availableFonts as font}
						<option value={font.value}>{font.name}</option>
					{/each}
				</select>
			</div>

			<div class="control-group">
				<div class="label-row">
					<label for="weight">굵기</label>
					<span class="value">{settings.fontWeight}</span>
				</div>
				<input
					type="range"
					id="weight"
					min="100"
					max="900"
					step="100"
					bind:value={settings.fontWeight}
				/>
			</div>

			<div class="control-group">
				<div class="label-row">
					<label for="spacing">자간</label>
					<span class="value">{settings.letterSpacing}em</span>
				</div>
				<input
					type="range"
					id="spacing"
					min="-0.1"
					max="0.5"
					step="0.01"
					bind:value={settings.letterSpacing}
				/>
			</div>

			<div class="control-group">
				<div class="label-row">
					<label for="leading">행간</label>
					<span class="value">{settings.lineHeight}</span>
				</div>
				<input
					type="range"
					id="leading"
					min="1.0"
					max="2.5"
					step="0.05"
					bind:value={settings.lineHeight}
				/>
			</div>

			<div class="control-group">
				<div class="label-row">
					<label for="size">크기</label>
					<span class="value">{settings.fontSize}px</span>
				</div>
				<input type="range" id="size" min="12" max="32" step="1" bind:value={settings.fontSize} />
			</div>

			<button class="preset-btn" on:click={applyPreset}> 최적 사전 설정값 적용 </button>
		</aside>
	</main>
</div>

<style>
	:global(body) {
		overflow: hidden;
	}

	.lab-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		overflow: hidden;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
		margin-bottom: 1rem;
		flex-shrink: 0;
	}

	.back-link {
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.page-title {
		font-size: 1.2rem;
		margin: 0;
	}

	main {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		flex: 1;
		overflow: hidden;
	}

	.paper-wrapper {
		display: flex;
		justify-content: center;
		padding: 2rem;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 8px;
		height: 100%;
		overflow-y: auto;
		align-items: flex-start;
	}

	.content-area {
		width: 100%;
		max-width: 800px;
		min-height: 600px;
		position: relative;
		transition: all 0.3s ease;
		background: white; /* Ensure it looks like paper */
		padding: 3rem; /* Add padding inside the paper */
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); /* Add shadow */
	}

	.content-area h1 {
		outline: none;
		border-bottom: 1px solid transparent;
	}

	.content-area p {
		outline: none;
		margin-bottom: 1.5em;
	}

	.content-area *:focus {
		border-bottom: 1px dashed #ccc;
	}

	.optimization-flash {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(66, 123, 88, 0.1);
		pointer-events: none;
		z-index: 10;
		border-radius: 2px;
	}

	.controls-panel {
		background: #fff;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		height: 100%;
		font-family: 'EB Garamond', 'Source Han Serif SC', serif;
		overflow-y: auto;
	}

	.control-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #555;
	}

	.label-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.value {
		font-size: 0.9rem;
		font-family: var(--font-mono);
		color: #777;
	}

	select,
	input[type='range'] {
		width: 100%;
	}

	/* Custom Range Slider Styling */
	input[type='range'] {
		-webkit-appearance: none;
		width: 100%;
		background: transparent;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: var(--color-accent-green);
		cursor: pointer;
		margin-top: -6px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	input[type='range']::-webkit-slider-runnable-track {
		width: 100%;
		height: 4px;
		cursor: pointer;
		background: #e0e0e0;
		border-radius: 2px;
	}

	input[type='range']:focus {
		outline: none;
	}

	select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: #fafafa;
		font-family: inherit;
	}

	.preset-btn {
		width: 100%;
		padding: 0.75rem;
		background: var(--color-accent-green);
		color: white;
		border: none;
		border-radius: 4px;
		font-weight: 600;
		transition: background 0.2s;
	}

	.preset-btn:hover {
		background: #356346;
	}

	@media (max-width: 900px) {
		main {
			grid-template-columns: 1fr;
		}

		.controls-panel {
			order: -1;
		}
	}
</style>
