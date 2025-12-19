<script lang="ts">
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Optimal CJK 서식 書式 연구</title>
</svelte:head>

<div class="hero" in:fade={{ duration: 500 }}>
	<div class="overlay"></div>

	<div class="content">
		<div class="bottom-left">
			<h1 class="project-title">Optimal CJK <br /> 서식 書式 연구</h1>
			<div class="meta-links">
				<a
					href="https://github.com/tjwhang/OptimalCJK"
					target="_blank"
					rel="noreferrer"
					class="icon-link"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path
							d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
						></path></svg
					>
					<span>GitHub Repo</span>
				</a>
				<a href="https://naver.com" class="icon-link">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline
							points="14 2 14 8 20 8"
						></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line
							x1="16"
							y1="17"
							x2="8"
							y2="17"
						></line><polyline points="10 9 9 9 8 9"></polyline></svg
					>
					<span>PDF Report</span>
				</a>
			</div>
		</div>

		<div class="bottom-right">
			<nav>
				<a href="{base}/lab" class="nav-item">
					<span class="number">01</span>
					<span class="text">타이포그래피 실험실</span>
				</a>
				<a href="{base}/calc" class="nav-item">
					<span class="number">02</span>
					<span class="text">통합 정보 밀도 계산기</span>
				</a>
				<a href="{base}/ux" class="nav-item">
					<span class="number">03</span>
					<span class="text">UX 체험</span>
				</a>
			</nav>
		</div>
	</div>
</div>

<style>
	.hero {
		position: relative;
		height: 100vh;
		width: 100%;
		background: linear-gradient(135deg, #2c3e50 0%, #000000 100%);
		color: #fdf6e3;
		overflow: hidden;
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.3);
		pointer-events: none;
	}

	.content {
		position: relative;
		height: 100%;
		width: 100%;
		max-width: 1600px;
		margin: 0 auto;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.bottom-left {
		position: absolute;
		bottom: 12rem;
		left: 4rem;
	}

	.bottom-right {
		position: absolute;
		bottom: 12rem;
		right: 4rem;
		text-align: right;
	}

	.project-title {
		font-family: var(--font-serif);
		font-size: 5rem;
		line-height: 1.3;
		margin-bottom: 2rem;
		font-weight: 500;
	}

	.meta-links {
		display: flex;
		gap: 1.5rem;
	}

	.icon-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		opacity: 0.7;
		font-size: 0.9rem;
		transition: opacity 0.2s;
	}

	.icon-link:hover {
		opacity: 1;
		color: #fff;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.nav-item {
		display: flex;
		align-items: baseline;
		justify-content: flex-end;
		gap: 1rem;
		font-size: 2rem;
		font-family: var(--font-serif);
		opacity: 0.6;
		transition: all 0.3s ease;
	}

	.nav-item:hover {
		opacity: 1;
		transform: translateX(-10px);
		color: #fff;
	}

	.number {
		font-family: var(--font-sans);
		font-size: 1rem;
		opacity: 0.5;
	}

	@media (max-width: 768px) {
		.content {
			padding: 1rem;
		}

		.bottom-left,
		.bottom-right {
			position: static;
			text-align: left;
			margin-bottom: 3rem;
		}

		.project-title {
			font-size: 2.5rem;
		}

		.nav-item {
			justify-content: flex-start;
			font-size: 1.5rem;
		}

		.nav-item:hover {
			transform: translateX(10px);
		}
	}
</style>
