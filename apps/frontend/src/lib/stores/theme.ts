import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemeName =
	| 'orange'
	| 'green'
	| 'beige'
	| 'purple'
	| 'gray'
	| 'blue'
	| 'cream'
	| 'pink';

export interface Theme {
	name: ThemeName;
	bgColor: string;
	buttonColor: string;
	buttonHoverColor: string;
	borderColor: string;
	buttonTextColor: string;
	highlightColor: string;
}

export const themes: Record<ThemeName, Theme> = {
	orange: {
		name: 'orange',
		bgColor: '#F5A623',
		buttonColor: '#F5A623',
		buttonHoverColor: '#E89314',
		borderColor: '#000000',
		buttonTextColor: '#000000',
		highlightColor: '#E89314'
	},
	green: {
		name: 'green',
		bgColor: '#C8D5B9',
		buttonColor: '#6B8E5C',
		buttonHoverColor: '#5A7A4D',
		borderColor: '#3D5234',
		buttonTextColor: '#FFFFFF',
		highlightColor: '#6B8E5C'
	},
	beige: {
		name: 'beige',
		bgColor: '#D4C5B0',
		buttonColor: '#8B7355',
		buttonHoverColor: '#7A6348',
		borderColor: '#4A3A28',
		buttonTextColor: '#FFFFFF',
		highlightColor: '#8B7355'
	},
	purple: {
		name: 'purple',
		bgColor: '#C5B9D8',
		buttonColor: '#7D6B9E',
		buttonHoverColor: '#6B5A8A',
		borderColor: '#3F3456',
		buttonTextColor: '#FFFFFF',
		highlightColor: '#7D6B9E'
	},
	gray: {
		name: 'gray',
		bgColor: '#D1D1D1',
		buttonColor: '#8A8A8A',
		buttonHoverColor: '#757575',
		borderColor: '#4A4A4A',
		buttonTextColor: '#FFFFFF',
		highlightColor: '#8A8A8A'
	},
	blue: {
		name: 'blue',
		bgColor: '#B9D0E0',
		buttonColor: '#5C7C8E',
		buttonHoverColor: '#4D6B7A',
		borderColor: '#2D3F4A',
		buttonTextColor: '#FFFFFF',
		highlightColor: '#5C7C8E'
	},
	cream: {
		name: 'cream',
		bgColor: '#E8E0B9',
		buttonColor: '#8E8560',
		buttonHoverColor: '#7A7350',
		borderColor: '#4A4530',
		buttonTextColor: '#FFFFFF',
		highlightColor: '#8E8560'
	},
	pink: {
		name: 'pink',
		bgColor: '#E0C5D8',
		buttonColor: '#8E5C7D',
		buttonHoverColor: '#7A4D6B',
		borderColor: '#4A2D3F',
		buttonTextColor: '#FFFFFF',
		highlightColor: '#8E5C7D'
	}
};

// Get initial theme from localStorage or default to orange
function getInitialTheme(): ThemeName {
	if (browser) {
		const stored = localStorage.getItem('tigerspot-theme');
		if (stored && stored in themes) {
			return stored as ThemeName;
		}
	}
	return 'orange';
}

function createThemeStore() {
	const { subscribe, set, update } = writable<ThemeName>(getInitialTheme());

	return {
		subscribe,
		set: (themeName: ThemeName) => {
			if (browser) {
				localStorage.setItem('tigerspot-theme', themeName);
				applyTheme(themeName);
			}
			set(themeName);
		},
		initialize: () => {
			if (browser) {
				const themeName = getInitialTheme();
				applyTheme(themeName);
				set(themeName);
			}
		}
	};
}

export function applyTheme(themeName: ThemeName) {
	if (!browser) return;

	const theme = themes[themeName];
	const root = document.documentElement;

	root.style.setProperty('--color-primary', theme.bgColor);
	root.style.setProperty('--color-primary-dark', theme.buttonHoverColor);
	root.style.setProperty('--theme-button-color', theme.buttonColor);
	root.style.setProperty('--theme-border-color', theme.borderColor);
	root.style.setProperty('--theme-button-text', theme.buttonTextColor);
	root.style.setProperty('--theme-highlight', theme.highlightColor);

	// Update body background
	document.body.style.backgroundColor = theme.bgColor;

	// Update the page border color for non-orange themes
	root.style.setProperty('--border-color', theme.borderColor);
}

export const currentTheme = createThemeStore();
