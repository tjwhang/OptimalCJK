<script lang="ts">
	import { fade } from 'svelte/transition';

	// Parameters
	let H = 10.0; // Entropy
	let s = 7.0; // Visual Strokes
	let a = 1.0; // Area
	let l = 4.0; // Length

	let isFullWidth = true; // w: 1.0 or 0.5

	// Coupled Variables
	let letterSpacing = 0.05; // k
	let lineHeight = 1.7; // h

	// Derived Values
	$: w = isFullWidth ? 1.0 : 0.5;
	$: lambda = (H * s) / (a * l);
	$: R = Math.round(Math.log(lambda / 1.75) * 100) / 100;
	$: targetArea = 0.75 * R; // A

	// Update functions
	function updateFromLineHeight() {
		// A = (w + k) * h
		// w + k = A / h
		// k = (A / h) - w
		const newK = targetArea / lineHeight - w;
		letterSpacing = Math.max(-0.2, Math.min(1.0, newK));
	}

	function updateFromLetterSpacing() {
		// A = (w + k) * h
		// h = A / (w + k)
		const newH = targetArea / (w + letterSpacing);
		lineHeight = Math.max(1.0, Math.min(3.0, newH));
	}

	// When parameters change, R changes, so A changes.
	// We need to decide which variable to keep constant or how to adjust.
	// Let's keep Line Height constant and adjust Letter Spacing, unless impossible.
	$: {
		// Reactively update when targetArea changes
		if (targetArea > 0) {
			updateFromLineHeight();
		}
	}

	function applyRecommendation() {
		// Priority: Line Height = 1.7 (or optimal for reading)
		// Let's say 1.7 is the "Golden" line height for this model
		lineHeight = 1.7;
		updateFromLineHeight();
	}
</script>

<svelte:head>
	<title>Density Calculator</title>
</svelte:head>

<div class="calc-container" in:fade>
	<header>
		<a href="/" class="back-link">← 돌아가기</a>
		<h1 class="page-title">통합 정보 밀도 계산기</h1>
	</header>

	<main>
		<div class="calculator-card paper-card">
			<h2>최적 여백 조정</h2>
			<p class="description">
				비율은 영어 알파벳을 1로 하며, 산출식은 다음과 같습니다.
				<em>R = ln(Λ / 1.75)</em>, where <em>Λ = (H · s) / (a · l)</em>.
				<em>A = 0.75 · R</em>. s. t. <em>A = (w + k) · h</em>.
			</p>

			<div class="visualization">
				<div
					class="sample-text"
					style:line-height={lineHeight}
					style:letter-spacing="{letterSpacing}em"
				>
					오늘 밤에도 별이 바람에 스치운다.<br />
					吾輩は猫である。名前はまだ無い。<br />
					學而不思則罔，思而不學則殆。<br />
					All that glitters is not gold. <br />
					Wir müssen wissen. Wir werden wissen. <br />
					Жить тяжело и неуютно, зато уютно умирать
				</div>
			</div>

			<div class="controls-grid">
				<!-- Parameters Section -->
				<div class="section parameters">
					<h3>매개변수</h3>

					<div class="control-group">
						<div class="label-row">
							<label for="entropy">정보 엔트로피 (<em>H</em>)</label>
							<span class="value">{H}</span>
						</div>
						<input type="range" id="entropy" min="1" max="15" step="0.1" bind:value={H} />
					</div>

					<div class="control-group">
						<div class="label-row">
							<label for="strokes">글자 당 획수 (<em>s</em>)</label>
							<span class="value">{s}</span>
						</div>
						<input type="range" id="strokes" min="1" max="20" step="0.1" bind:value={s} />
					</div>

					<div class="control-group">
						<div class="label-row">
							<label for="area">글자 당 점유 공간 (<em>a</em>)</label>
							<span class="value">{a}</span>
						</div>
						<input type="range" id="area" min="0.5" max="2" step="0.1" bind:value={a} />
					</div>

					<div class="control-group">
						<div class="label-row">
							<label for="lang">평균 단어 길이 (<em>l</em>)</label>
							<span class="value">{l}</span>
						</div>
						<input type="range" id="lang" min="1" max="10" step="0.1" bind:value={l} />
					</div>

					<div class="control-group toggle-group">
						<label>폭 (<em>w</em>)</label>
						<button
							class="toggle-btn"
							class:active={isFullWidth}
							on:click={() => (isFullWidth = true)}
						>
							전각(全角) (1.0)
						</button>
						<button
							class="toggle-btn"
							class:active={!isFullWidth}
							on:click={() => (isFullWidth = false)}
						>
							반각(半角) (0.5)
						</button>
					</div>
				</div>

				<!-- Results & Sliders Section -->
				<div class="section results">
					<h3>도출 수치</h3>
					<div class="metrics-display">
						<div class="metric-box">
							<span class="label">정보 부하량 <em>Λ</em></span>
							<span class="val">{lambda.toFixed(2)}</span>
						</div>
						<div class="metric-box">
							<span class="label">비율 <em>R</em></span>
							<span class="val">{R.toFixed(2)}</span>
						</div>
						<div class="metric-box highlight">
							<span class="label">총 점유 공간 <em>A</em></span>
							<span class="val">{targetArea.toFixed(2)}</span>
						</div>
					</div>

					<h3>여백 조정</h3>

					<div class="control-group">
						<div class="label-row">
							<label for="lh">행간(行間) (<em>h</em>)</label>
							<span class="value">{lineHeight.toFixed(3)}</span>
						</div>
						<input
							type="range"
							id="lh"
							min="1.0"
							max="3.0"
							step="0.01"
							bind:value={lineHeight}
							on:input={updateFromLineHeight}
						/>
					</div>

					<div class="control-group">
						<div class="label-row">
							<label for="ls">자간(字間) (<em>k</em>)</label>
							<span class="value">{letterSpacing.toFixed(3)}em</span>
						</div>
						<input
							type="range"
							id="ls"
							min="-0.2"
							max="1.0"
							step="0.005"
							bind:value={letterSpacing}
							on:input={updateFromLetterSpacing}
						/>
					</div>

					<button class="recommend-btn" on:click={applyRecommendation}>
						최적 수치 적용 (행간 우선시)
					</button>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	:global(body) {
		overflow: hidden;
	}

	.calc-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		align-items: center;
		overflow: hidden;
	}

	header {
		width: 100%;
		max-width: 1000px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 0;
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
		width: 100%;
		max-width: 1000px;
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.calculator-card {
		padding: 2rem;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	h2 {
		margin-top: 0;
		font-size: 1.5rem;
		color: var(--color-accent-green);
		flex-shrink: 0;
	}

	.description {
		color: #666;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		background: #f9f9f9;
		padding: 1rem;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.visualization {
		background: #fff;
		padding: 2rem;
		border: 1px solid #eee;
		border-radius: 4px;
		margin-bottom: 1rem;
		min-height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow-y: auto;
		max-height: 30vh;
	}

	.sample-text {
		font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
		font-size: 1.6rem;
		font-weight: 500;
		color: #333;
		text-align: center;
		transition: all 0.2s ease;
	}

	.controls-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		overflow-y: auto;
		flex: 1;
		padding-right: 0.5rem;
	}

	.section {
		background: rgba(0, 0, 0, 0.02);
		padding: 1.5rem;
		border-radius: 4px;
	}

	.control-group {
		margin-bottom: 1.2rem;
	}

	.label-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.25rem;
	}

	label {
		font-weight: 600;
		color: #555;
		font-size: 0.85rem;
	}

	.value {
		font-family: var(--font-mono);
		color: #777;
		font-size: 0.8rem;
	}

	/* Custom Range Slider Styling (Calm Green) */
	input[type='range'] {
		-webkit-appearance: none;
		width: 100%;
		background: transparent;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 14px;
		width: 14px;
		border-radius: 50%;
		background: var(--color-accent-green);
		cursor: pointer;
		margin-top: -5px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	input[type='range']::-webkit-slider-runnable-track {
		width: 100%;
		height: 4px;
		cursor: pointer;
		background: #d0d0d0;
		border-radius: 2px;
	}

	input[type='range']:focus {
		outline: none;
	}

	.toggle-group {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.toggle-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		background: #fff;
		border-radius: 4px;
		font-size: 0.8rem;
		cursor: pointer;
		flex: 1;
	}

	.toggle-btn.active {
		background: var(--color-accent-green);
		color: white;
		border-color: var(--color-accent-green);
	}

	.metrics-display {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.metric-box {
		flex: 1;
		background: #fff;
		padding: 0.75rem;
		border-radius: 4px;
		text-align: center;
		border: 1px solid #eee;
	}

	.metric-box.highlight {
		border-color: var(--color-accent-green);
		background: #f0f7f4;
	}

	.metric-box .label {
		display: block;
		font-size: 0.7rem;
		color: #888;
		margin-bottom: 0.25rem;
	}

	.metric-box .val {
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 1.1rem;
		color: #333;
	}

	.recommend-btn {
		width: 100%;
		padding: 0.75rem;
		background: var(--color-text);
		color: #fff;
		border: none;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.9rem;
		margin-top: 1rem;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.recommend-btn:hover {
		opacity: 0.9;
	}

	@media (max-width: 768px) {
		.controls-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
