<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { uxExperimentState } from '$lib/stores';

	let startTime = 0;
	let misclicks = 0;

	// Task Data (Dynamic)
	const RECIPIENTS = [
		'Aaron Jones',
		'Adam Smith',
		'Alice Smith',
		'Bob Brown',
		'Charlie Day',
		'David Evans',
		'Frank Green',
		'Grace Hill',
		'Hannah Ice',
		'Ian Jack',
		'Jenny King',
		'Kevin Lee'
	];

	// Dynamic Task State
	let targetPassword = '0000';
	let targetRecipient = '';
	let targetAmount = '';
	let showSuccess = false;

	// Local state for the form inputs
	let password = '';
	let selectedRecipient = '';
	let amountInput = '';

	// Bad UI specific state
	let badUiStep = 0; // 0: Form, 1: Security Check
	let badUiTermsChecked = false;
	let badUiSecurityAnswer = '';
	let badKeypadNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	let goodKeypadNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

	// Subscribe to store
	let state = $uxExperimentState;
	$: uxExperimentState.set(state);

	onMount(() => {
		generateTask();
	});

	function generateTask() {
		// Randomize Task
		targetRecipient = RECIPIENTS[Math.floor(Math.random() * RECIPIENTS.length)];
		// Amount between 10 and 150
		const amt = Math.floor(Math.random() * (150 - 10 + 1)) + 10;
		targetAmount = amt.toFixed(2);
		// Random 4 digit password
		targetPassword = Math.floor(1000 + Math.random() * 9000).toString();
	}

	function shuffleArray(array: any[]) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	function startExperiment() {
		state.step = 'bad-ui';
		resetTask();
		startTime = Date.now();
	}

	function resetTask() {
		password = '';
		selectedRecipient = '';
		amountInput = '';
		misclicks = 0;
		badUiStep = 0;
		badUiTermsChecked = false;
		badUiSecurityAnswer = '';
		badKeypadNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		goodKeypadNumbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
	}

	function handleMisclick() {
		misclicks++;
	}

	function completePhase(phase: 'bad-ui' | 'good-ui') {
		const timeTaken = Date.now() - startTime;

		showSuccess = true;
		setTimeout(() => {
			showSuccess = false;
			if (phase === 'bad-ui') {
				state.badUiMetrics = { time: timeTaken, misclicks };
				state.step = 'good-ui';
				resetTask();
				startTime = Date.now();
			} else {
				state.goodUiMetrics = { time: timeTaken, misclicks };
				state.step = 'result';
				submitResults();
			}
		}, 1500);
	}

	async function submitResults() {
		try {
			await fetch('/api/record', {
				method: 'POST',
				body: JSON.stringify({
					bad: state.badUiMetrics,
					good: state.goodUiMetrics,
					timestamp: new Date().toISOString()
				}),
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (e) {
			console.error('Failed to submit results', e);
		}
	}

	// --- Bad UI Logic ---
	// Annoying features:
	// 1. Password must be entered via a shuffled on-screen keypad (simulated by just blocking keyboard and showing a small keypad).
	// 2. Recipient list is long and unsorted.
	// 3. Amount must be exact "50.00".
	// 4. Must check a tiny terms box.
	// 5. "Security Question" popup before submit.

	let showBadKeypad = false;

	function badUiSubmit() {
		if (password !== targetPassword) {
			alert('Authentication Failed: Invalid Password');
			return;
		}
		if (selectedRecipient !== targetRecipient) {
			alert('Error: Invalid Beneficiary Selection');
			return;
		}

		const inputFloat = parseFloat(amountInput);
		const targetFloat = parseFloat(targetAmount);
		if (isNaN(inputFloat) || Math.abs(inputFloat - targetFloat) > 0.01) {
			alert(`Error: Invalid Amount. Must be exactly ${targetAmount}`);
			return;
		}

		if (!badUiTermsChecked) {
			alert('Error: You must accept the Terms & Conditions');
			return;
		}

		// Proceed to annoying security check
		badUiStep = 1;
	}

	function badUiFinalSubmit() {
		if (badUiSecurityAnswer.toLowerCase() !== 'blue') {
			alert('Security Check Failed. Hint: The sky is...');
			return;
		}
		completePhase('bad-ui');
	}

	function appendBadPassword(num: number) {
		if (password.length < 4) password += num;
	}

	// --- Good UI Logic ---
	let goodUiStep = 0; // 0: Password, 1: Recipient, 2: Amount, 3: Confirm

	function goodUiNext() {
		goodUiStep++;
	}

	function goodUiSubmit() {
		completePhase('good-ui');
	}
</script>

<svelte:head>
	<title>UX Experiment</title>
</svelte:head>

<div class="ux-container">
	<!-- Background for the whole experiment -->
	<div class="ux-background"></div>

	{#if state.step === 'intro'}
		<div class="modal-overlay" in:fade>
			<div class="modal paper-card">
				<h1>UX Research Experiment</h1>
				<p>You will perform a simple money transfer task twice.</p>
				<p>
					<strong>Task:</strong> Send <strong>${targetAmount || '...'}</strong> to
					<strong>{targetRecipient || '...'}</strong>.
				</p>
				<p><strong>Password:</strong> {targetPassword}</p>
				<p class="warning">Please do not rush. Accuracy matters.</p>
				<button class="start-btn" on:click={startExperiment}>Start Experiment</button>
			</div>
		</div>
	{/if}

	{#if state.step === 'bad-ui'}
		<div class="phone-frame" in:fade={{ duration: 300 }}>
			<div
				class="screen bad-ui"
				on:click={handleMisclick}
				role="button"
				tabindex="0"
				on:keydown={() => {}}
			>
				<div class="status-bar">12:00 PM</div>
				<div class="app-header">BankApp Legacy</div>

				{#if badUiStep === 0}
					<div class="form-container" on:click|stopPropagation={() => {}}>
						<div class="row">
							<label>User Auth (Secure Keypad Only)</label>
							<div class="input-wrapper">
								<input
									type="password"
									value={password}
									placeholder="Tap to open keypad"
									readonly
									on:click={() => (showBadKeypad = !showBadKeypad)}
								/>
							</div>
							{#if showBadKeypad}
								<div class="bad-keypad">
									{#each badKeypadNumbers as num}
										<button on:click={() => appendBadPassword(num)}>{num}</button>
									{/each}
									<button class="clear" on:click={() => (password = '')}>C</button>
								</div>
							{/if}
						</div>

						<div class="row">
							<label>Select Beneficiary</label>
							<select bind:value={selectedRecipient} size="3">
								<option value="">-- Select --</option>
								{#each RECIPIENTS as recipient}
									<option value={recipient}>{recipient}</option>
								{/each}
							</select>
						</div>

						<div class="row">
							<label>Transfer Amt (Format: 00.00)</label>
							<input type="text" bind:value={amountInput} placeholder="0.00" />
						</div>

						<div class="row terms">
							<input type="checkbox" id="terms" bind:checked={badUiTermsChecked} />
							<label for="terms">I agree to the <a href="#">Terms</a></label>
						</div>

						<div class="actions">
							<button class="btn-cancel">Cancel</button>
							<button class="btn-submit" on:click={badUiSubmit}>Next Step</button>
						</div>

						<div class="ads">
							<small>Apply for a loan today! 5% APR.</small>
						</div>
					</div>
				{:else}
					<div class="security-check" on:click|stopPropagation={() => {}}>
						<h3>Security Verification</h3>
						<p>What color is the sky?</p>
						<input type="text" bind:value={badUiSecurityAnswer} placeholder="Answer..." />
						<button class="btn-submit" on:click={badUiFinalSubmit}>Confirm Transaction</button>
					</div>
				{/if}
			</div>
			<div class="label">Interface A</div>
		</div>
	{/if}

	{#if state.step === 'good-ui'}
		<div class="phone-frame" in:fade={{ duration: 300 }}>
			<div
				class="screen good-ui"
				on:click={handleMisclick}
				role="button"
				tabindex="0"
				on:keydown={() => {}}
			>
				<div class="status-bar-clean"></div>

				<div class="good-content" on:click|stopPropagation={() => {}}>
					{#if goodUiStep === 0}
						<div class="step-container" in:fly={{ x: 20, duration: 300 }}>
							<h2>Welcome Back</h2>
							<p class="subtitle">Enter your PIN to continue</p>
							<div class="pin-display">
								{#each Array(4) as _, i}
									<div class="dot" class:filled={password.length > i}></div>
								{/each}
							</div>
							<div class="numpad">
								{#each goodKeypadNumbers as num}
									{#if num !== undefined}
										<button
											on:click={() => {
												if (password.length < 4) password += num;
												if (password === targetPassword) setTimeout(goodUiNext, 200);
											}}>{num}</button
										>
									{/if}
								{/each}
								<button class="empty"></button>
								<button on:click={() => (password = password.slice(0, -1))}>⌫</button>
							</div>
						</div>
					{:else if goodUiStep === 1}
						<div class="step-container" in:fly={{ x: 20, duration: 300 }}>
							<h2>Send Money</h2>
							<p class="subtitle">Who are you sending to?</p>
							<div class="recipient-list">
								{#each RECIPIENTS as recipient, i}
									<button
										class="recipient-card"
										on:click={() => {
											selectedRecipient = recipient;
											goodUiNext();
										}}
									>
										<div class="avatar">
											{recipient
												.split(' ')
												.map((n) => n[0])
												.join('')}
										</div>
										<div class="info">
											<span class="name">{recipient}</span>
											<span class="details">**** {1234 + i}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					{:else if goodUiStep === 2}
						<div class="step-container" in:fly={{ x: 20, duration: 300 }}>
							<h2>Amount</h2>
							<p class="subtitle">How much to send?</p>
							<div class="amount-display">
								<span class="currency">$</span>
								<span class="value">{amountInput || '0'}</span>
							</div>
							<div class="numpad">
								{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
									<button
										on:click={() =>
											(amountInput = amountInput === '0' ? num.toString() : amountInput + num)}
										>{num}</button
									>
								{/each}
								<button on:click={() => (amountInput += '.')}>.</button>
								<button
									on:click={() => (amountInput = amountInput === '0' ? '0' : amountInput + '0')}
									>0</button
								>
								<button on:click={() => (amountInput = amountInput.slice(0, -1))}>⌫</button>
							</div>
							<button
								class="main-btn"
								style="margin-top: 1rem;"
								on:click={() => {
									const val = parseFloat(amountInput);
									const target = parseFloat(targetAmount);
									if (!isNaN(val) && Math.abs(val - target) < 0.01) goodUiNext();
								}}>Next</button
							>
						</div>
					{:else if goodUiStep === 3}
						<div class="step-container" in:fly={{ x: 20, duration: 300 }}>
							<h2>Confirm</h2>
							<div class="summary-card">
								<div class="row">
									<span>To</span>
									<strong>{selectedRecipient}</strong>
								</div>
								<div class="row">
									<span>Amount</span>
									<strong>${amountInput}</strong>
								</div>
								<div class="row total">
									<span>Total</span>
									<strong>${amountInput}</strong>
								</div>
							</div>
							<button class="main-btn" on:click={goodUiSubmit}>Send Now</button>
						</div>
					{/if}
				</div>
			</div>
			<div class="label">Interface B</div>
		</div>
	{/if}

	{#if showSuccess}
		<div class="modal-overlay" in:fade={{ duration: 200 }}>
			<div class="modal paper-card" style="background: #e6ffe6; border-color: #427b58;">
				<h2 style="color: #427b58;">Success!</h2>
				<p>Transaction Completed.</p>
			</div>
		</div>
	{/if}

	{#if state.step === 'result'}
		<div class="modal-overlay" in:fade>
			<div class="modal paper-card">
				<h1>Experiment Complete</h1>

				<div class="results-grid">
					<div class="result-col">
						<h3>Interface A (Bad)</h3>
						<p>Time: {(state.badUiMetrics.time / 1000).toFixed(2)}s</p>
						<p>Misclicks: {state.badUiMetrics.misclicks}</p>
					</div>
					<div class="result-col">
						<h3>Interface B (Good)</h3>
						<p>Time: {(state.goodUiMetrics.time / 1000).toFixed(2)}s</p>
						<p>Misclicks: {state.goodUiMetrics.misclicks}</p>
					</div>
				</div>

				<div class="improvement">
					{#if state.badUiMetrics.time > 0}
						<p>
							Efficiency Improvement: <strong
								>{Math.round(
									((state.badUiMetrics.time - state.goodUiMetrics.time) / state.badUiMetrics.time) *
										100
								)}%</strong
							>
						</p>
					{/if}
				</div>

				<a href="/" class="home-btn">Back to Home</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.ux-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.ux-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #222;
		z-index: -1;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.modal {
		max-width: 500px;
		width: 90%;
		text-align: center;
	}

	.start-btn,
	.home-btn {
		display: inline-block;
		margin-top: 2rem;
		padding: 1rem 2rem;
		background: var(--color-accent-green);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1.1rem;
		text-decoration: none;
	}

	.phone-frame {
		width: 375px;
		height: 667px;
		background: #111;
		border-radius: 40px;
		padding: 15px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
		position: relative;
		max-width: 100%;
		max-height: 100vh;
	}

	@media (max-width: 480px) {
		.phone-frame {
			width: 100%;
			height: 100vh;
			border-radius: 0;
			padding: 0;
		}

		.screen {
			border-radius: 0;
		}
	}

	.screen {
		width: 100%;
		height: 100%;
		background: #fff;
		border-radius: 25px;
		overflow: hidden;
		position: relative;
	}

	.label {
		text-align: center;
		color: #666;
		margin-top: 1rem;
		font-family: var(--font-mono);
	}

	/* Bad UI Styles */
	.bad-ui {
		background: #e0e0e0;
		font-family: Arial, sans-serif;
	}

	.bad-ui .status-bar {
		background: #333;
		color: #fff;
		padding: 5px;
		font-size: 10px;
	}

	.bad-ui .app-header {
		background: linear-gradient(to bottom, #004080, #002040);
		color: white;
		padding: 15px;
		font-weight: bold;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	}

	.bad-ui .form-container {
		padding: 20px;
	}

	.bad-ui .row {
		margin-bottom: 15px;
	}

	.bad-ui label {
		display: block;
		font-size: 12px;
		color: #555;
		margin-bottom: 2px;
	}

	.bad-ui input,
	.bad-ui select {
		width: 100%;
		padding: 5px;
		border: 1px solid #999;
	}

	.bad-ui .bad-keypad {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 2px;
		margin-top: 5px;
		background: #ccc;
		padding: 5px;
	}

	.bad-ui .bad-keypad button {
		padding: 5px;
		font-size: 10px;
		background: #fff;
		border: 1px solid #999;
	}

	.bad-ui .terms {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 10px;
	}

	.bad-ui .terms input {
		width: auto;
	}

	.bad-ui .actions {
		display: flex;
		justify-content: space-between;
		margin-top: 30px;
	}

	.bad-ui button {
		padding: 5px 10px;
		font-size: 12px;
	}

	.bad-ui .btn-submit {
		background: #ddd; /* Low contrast */
		border: 1px solid #999;
	}

	.bad-ui .ads {
		margin-top: 50px;
		text-align: center;
		color: red;
		border: 1px dashed red;
		padding: 10px;
	}

	.security-check {
		padding: 20px;
		text-align: center;
		margin-top: 50px;
	}

	/* Good UI Styles */
	.good-ui {
		background: #fff;
		font-family: 'Inter', sans-serif;
		display: flex;
		flex-direction: column;
	}

	.good-content {
		flex: 1;
		padding: 2rem;
		display: flex;
		flex-direction: column;
	}

	.step-container {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.good-ui h2 {
		font-size: 1.8rem;
		margin-bottom: 0.5rem;
		color: #111;
	}

	.good-ui .subtitle {
		color: #666;
		margin-bottom: 2rem;
	}

	.pin-display {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 3rem;
	}

	.dot {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		border: 1px solid #ccc;
	}

	.dot.filled {
		background: #000;
		border-color: #000;
	}

	.numpad {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-top: auto;
		margin-bottom: 1rem;
	}

	.numpad button {
		aspect-ratio: 1.6;
		border-radius: 12px;
		border: none;
		background: #f5f5f5;
		font-size: 1.5rem;
		font-weight: 500;
		transition: background 0.1s;
	}

	.numpad button:active {
		background: #ddd;
	}

	.recipient-card {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 1rem;
		background: #fff;
		border: 1px solid #eee;
		border-radius: 12px;
		margin-bottom: 1rem;
		text-align: left;
		transition:
			transform 0.1s,
			box-shadow 0.1s;
	}

	.recipient-card:active {
		transform: scale(0.98);
		background: #fafafa;
	}

	.avatar {
		width: 40px;
		height: 40px;
		background: #eee;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		margin-right: 1rem;
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.info .name {
		font-weight: 600;
	}

	.info .details {
		font-size: 0.8rem;
		color: #888;
	}

	.amount-display {
		font-size: 3rem;
		font-weight: 700;
		text-align: center;
		margin-bottom: 2rem;
	}

	.summary-card {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.summary-card .row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.summary-card .total {
		border-top: 1px solid #ddd;
		padding-top: 1rem;
		font-size: 1.2rem;
		margin-bottom: 0;
	}

	.main-btn {
		width: 100%;
		padding: 1.2rem;
		background: #000;
		color: #fff;
		border: none;
		border-radius: 12px;
		font-size: 1.1rem;
		font-weight: 600;
		margin-top: auto;
	}

	.results-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin: 2rem 0;
	}

	.result-col {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 8px;
	}
</style>
