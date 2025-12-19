<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { uxExperimentState } from '$lib/stores';

	let startTime = 0;
	let misclicks = 0;

	// Task Data (Dynamic)
	const RECIPIENTS = [
		'김두한',
		'박문수',
		'박제비',
		'성춘향',
		'심 영',
		'아무개',
		'연놀부',
		'연흥부',
		'이몽룡',
		'이소룡',
		'최 척',
		'홍길동'
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

		if (targetRecipient === '김두한') {
			targetAmount = '4.00';
		} else {
			// Amount between 10 and 150
			const amt = Math.floor(Math.random() * (150 - 10 + 1)) + 10;
			targetAmount = amt.toFixed(2);
		}

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
		if (badUiSecurityAnswer.toLowerCase() !== '0') {
			alert('보안 확인에 실패했습니다. 힌트: sin π = ?');
			return;
		}
		completePhase('bad-ui');
	}

	function appendBadPassword(num: number) {
		if (password.length < 4) password += num;
	}

	// --- Good UI Logic ---
	let goodUiStep = 0; // 0: Password, 1: Recipient, 2: Amount, 3: Confirm
	let goodUiError = '';

	function goodUiNext() {
		goodUiStep++;
		goodUiError = '';
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

	{#if state.step === 'bad-ui' || state.step === 'good-ui'}
		<div class="task-memo" in:fly={{ x: -50, duration: 500 }}>
			<h3>할 일</h3>
			<div class="memo-row">
				<span>받을 사람:</span>
				<strong>{targetRecipient}</strong>
			</div>
			<div class="memo-row">
				<span>보낼 금액:</span>
				<strong>${targetAmount}</strong>
			</div>
			<div class="memo-row">
				<span>비밀번호:</span>
				<strong>{targetPassword}</strong>
			</div>
		</div>
	{/if}

	{#if state.step === 'intro'}
		<div class="modal-overlay" in:fade>
			<div class="modal paper-card">
				<h1>UI/UX 체험 및 실험</h1>
				<p>간단한 송금 UI를 이용하는 시나리오를 두 번 수행하게 될 것입니다.</p>
				<p>
					<strong>할 일:</strong> <strong>${targetAmount || '...'}</strong>을(를)
					<strong>{targetRecipient || '...'}</strong> 님 에게 송금하세요.
				</p>
				<p><strong>결제 비밀번호:</strong> {targetPassword}</p>
				<p class="warning">
					이건 실험, 체험이지 스피드런이 아닙니다. 정확하게 누르는 것을 우선해 수행해 주세요.
					극단적인 기록은 데이터 전처리 과정에서 걸러집니다.
				</p>
				<button class="start-btn" on:click={startExperiment}>시작하기!</button>
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
				<div class="status-bar">오후 12:00</div>
				<div class="app-header">구질구질 은행 모바일 앱</div>

				{#if badUiStep === 0}
					<div class="form-container" on:click|stopPropagation={() => {}}>
						<div class="row">
							<label>사용자 인증 (보안 키패드 전용)</label>
							<div class="input-wrapper">
								<input
									type="password"
									value={password}
									placeholder="여기를 눌러 키패드를 열기"
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
							<label>수금인 선택</label>
							<select bind:value={selectedRecipient} size="3">
								<option value="">-- 수금인을 선택하세요 --</option>
								{#each RECIPIENTS as recipient}
									<option value={recipient}>{recipient}</option>
								{/each}
							</select>
						</div>

						<div class="row">
							<label>송금 액수</label>
							<input type="text" bind:value={amountInput} placeholder="0.00" />
						</div>

						<div class="row terms">
							<input type="checkbox" id="terms" bind:checked={badUiTermsChecked} />
							<label for="terms"><a href="#">이용 약관</a>에 동의합니다.</label>
						</div>

						<div class="actions">
							<button class="btn-cancel">취소</button>
							<button class="btn-submit" on:click={badUiSubmit}>다음</button>
						</div>

						<div class="ads">
							<small>지금 대출 받으세요! 이자 5% --- 파뿌리 저축은행</small>
						</div>
						<div class="ads">
							<small>먹히는 디자인을 배우려면? 겉돌이 디자인 학원!</small>
						</div>
					</div>
				{:else}
					<div class="security-check" on:click|stopPropagation={() => {}}>
						<h3>보안 확인 질문</h3>
						<p>파이를 쌓으면?</p>
						<input type="text" bind:value={badUiSecurityAnswer} placeholder="답을 입력하세요..." />
						<button class="btn-submit" on:click={badUiFinalSubmit}>송금 확인</button>
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
							<h2>안녕하세요!</h2>
							<p class="subtitle">진행하려면 비밀번호를 입력하세요</p>
							<div class="pin-display">
								{#each Array(4) as _, i}
									<div class="dot" class:filled={password.length > i}></div>
								{/each}
							</div>
							{#if goodUiError}
								<p class="error-msg" in:fade>{goodUiError}</p>
							{/if}
							<div class="numpad">
								{#each goodKeypadNumbers as num}
									{#if num !== undefined}
										<button
											on:click={() => {
												if (password.length < 4) password += num;
												if (password.length === 4) {
													if (password === targetPassword) {
														setTimeout(goodUiNext, 200);
													} else {
														goodUiError = '틀린 비밀번호입니다.';
														setTimeout(() => {
															password = '';
															goodUiError = '';
														}, 1000);
													}
												}
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
							<h2>돈 보내기</h2>
							<p class="subtitle">누구에게 보내시겠어요?</p>
							{#if goodUiError}
								<p class="error-msg" in:fade>{goodUiError}</p>
							{/if}
							<div class="recipient-list">
								{#each RECIPIENTS as recipient, i}
									<button
										class="recipient-card"
										on:click={() => {
											if (recipient === targetRecipient) {
												selectedRecipient = recipient;
												goodUiNext();
											} else {
												goodUiError = '얘한테 보내면 안됩니다.';
												setTimeout(() => (goodUiError = ''), 1000);
											}
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
							<h2>액수</h2>
							<p class="subtitle">얼마나 보내시겠어요?</p>
							<div class="amount-display">
								<span class="currency">$</span>
								<span class="value">{amountInput || '0'}</span>
							</div>
							{#if goodUiError}
								<p class="error-msg" in:fade>{goodUiError}</p>
							{/if}
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
									if (!isNaN(val) && Math.abs(val - target) < 0.01) {
										goodUiNext();
									} else {
										goodUiError = '액수가 틀립니다.';
										setTimeout(() => (goodUiError = ''), 1000);
									}
								}}>다음</button
							>
						</div>
					{:else if goodUiStep === 3}
						<div class="step-container" in:fly={{ x: 20, duration: 300 }}>
							<h2>송금 확인</h2>
							<div class="summary-card">
								<div class="row">
									<strong>{selectedRecipient}</strong>
									<span> 님 에게</span>
								</div>
								<div class="row">
									<span>액수 확인: </span>
									<strong>${amountInput}</strong>
									<span>을(를) 보냅니다.</span>
								</div>
								<div class="row total">
									<span>총액</span>
									<strong>${amountInput}</strong>
								</div>
							</div>
							<button class="main-btn" on:click={goodUiSubmit}>지금 보내기</button>
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
				<h2 style="color: #427b58;">성공!</h2>
				<p>송금을 완료했습니다.</p>
			</div>
		</div>
	{/if}

	{#if state.step === 'result'}
		<div class="modal-overlay" in:fade>
			<div class="modal paper-card">
				<h1>체험 종료</h1>

				<div class="results-grid">
					<div class="result-col">
						<h3>Interface A</h3>
						<p>소요 시간: {(state.badUiMetrics.time / 1000).toFixed(2)}s</p>
						<p>잘못 누른 횟수: {state.badUiMetrics.misclicks}</p>
					</div>
					<div class="result-col">
						<h3>Interface B</h3>
						<p>소요 시간: {(state.goodUiMetrics.time / 1000).toFixed(2)}s</p>
						<p>잘못 누른 횟수: {state.goodUiMetrics.misclicks}</p>
					</div>
				</div>

				<div class="improvement">
					{#if state.badUiMetrics.time > 0}
						<p>
							정확도 향상: <strong
								>{Math.round(
									((state.badUiMetrics.time - state.goodUiMetrics.time) / state.badUiMetrics.time) *
										100
								)}%</strong
							>

							<br />
							사실 UI 디자인이 불공평한 것부터 반 정도 농담이었어요.
							<br />
							참여해 주셔서 감사합니다.
						</p>
					{/if}
					{#if targetRecipient === '김두한'}
						<h2 style="color: #ff9800; margin-top: 1rem; font-size: 2rem;">
							오케이, 땡큐! 4 딸라!
						</h2>
					{/if}
				</div>

				<a href="/" class="home-btn">처음으로 돌아가기</a>
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
		min-height: 0; /* Ensure flex child can shrink */
	}

	.step-container {
		flex: 1;
		min-height: 0; /* Ensure flex child can shrink */
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

	.recipient-list {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		padding-right: 5px; /* Avoid scrollbar covering content */
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

	.task-memo {
		position: absolute;
		top: 20px;
		right: 20px;
		width: 200px;
		background: #fff9c4; /* Post-it yellow */
		padding: 15px;
		box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
		transform: rotate(2deg);
		z-index: 50;
		font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif;
		color: #333;
	}

	.task-memo h3 {
		margin: 0 0 10px 0;
		font-size: 1.1rem;
		border-bottom: 1px dashed #999;
		padding-bottom: 5px;
	}

	.memo-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 5px;
		font-size: 0.9rem;
	}

	.error-msg {
		color: #d32f2f;
		text-align: center;
		margin-bottom: 1rem;
		font-weight: bold;
		background: #ffebee;
		padding: 0.5rem;
		border-radius: 4px;
	}

	@media (max-width: 800px) {
		.task-memo {
			position: static;
			width: 100%;
			margin-bottom: 20px;
			transform: none;
		}

		.ux-container {
			flex-direction: column;
			padding: 20px;
			overflow-y: auto;
		}
	}
</style>
