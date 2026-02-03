import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
	content: ['./src/**/*.{html,js,ts,svelte}', './src/routes/**/*.{html,js,ts,svelte}'],
	theme: {
		extend: {
			colors: {
				'burnt-peach': 'rgb(var(--palette-burnt-peach) / <alpha-value>)',
				'pearl-beige': 'rgb(var(--palette-pearl-beige) / <alpha-value>)',
				'blue-slate': 'rgb(var(--palette-blue-slate) / <alpha-value>)',
				'pale-sky': 'rgb(var(--palette-pale-sky) / <alpha-value>)',
				'alabaster-grey': 'rgb(var(--palette-alabaster-grey) / <alpha-value>)',
				'surface-white': 'rgb(var(--palette-surface-white) / <alpha-value>)',
				'text-ink': 'rgb(var(--palette-text-ink) / <alpha-value>)',
				'text-muted': 'rgb(var(--palette-text-muted) / <alpha-value>)',
				'border-soft': 'rgb(var(--palette-blue-slate) / 0.25)',
				'border-strong': 'rgb(var(--palette-blue-slate) / 0.45)'
			},
			opacity: {
				12: '0.12',
				15: '0.15',
				18: '0.18',
				35: '0.35',
				45: '0.45',
				55: '0.55',
				85: '0.85'
			}
		}
	},
	plugins: [typography]
};

export default config;
