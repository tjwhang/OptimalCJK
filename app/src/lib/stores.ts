import { writable } from 'svelte/store';

export const theme = writable('sepia');

export const typographySettings = writable({
	language: 'English',
	fontFamily: '"STIX Two Text", serif',
	fontWeight: 500,
	letterSpacing: 0,
	lineHeight: 1.6,
	fontSize: 22
});

export const uxExperimentState = writable({
	step: 'intro', // intro, bad-ui, good-ui, result
	badUiMetrics: { time: 0, misclicks: 0 },
	goodUiMetrics: { time: 0, misclicks: 0 }
});
