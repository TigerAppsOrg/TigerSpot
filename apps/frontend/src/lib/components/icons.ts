type IconDefinition = {
	viewBox?: string;
	paths?: string[];
	circles?: { cx: number; cy: number; r: number }[];
	rects?: { x: number; y: number; width: number; height: number; rx?: number; ry?: number }[];
	lines?: { x1: number; y1: number; x2: number; y2: number }[];
	polylines?: string[];
	polygons?: string[];
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
};

export const icons = {
	home: {
		paths: ['M3 11l9-8 9 8', 'M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10']
	},
	trophy: {
		paths: [
			'M6 4h12v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V4z',
			'M12 12v4',
			'M8 20h8',
			'M6 4H4a2 2 0 0 0-2 2v1a5 5 0 0 0 5 5',
			'M18 4h2a2 2 0 0 1 2 2v1a5 5 0 0 1-5 5'
		]
	},
	medal: {
		circles: [{ cx: 12, cy: 8, r: 5 }],
		paths: ['M15.477 12.89 17 22l-5-3-5 3 1.523-9.11']
	},
	chart: {
		paths: ['M3 3v18h18', 'M7 17v-6', 'M12 17V7', 'M17 17v-9']
	},
	user: {
		circles: [{ cx: 12, cy: 8, r: 4 }],
		paths: ['M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2']
	},
	users: {
		circles: [
			{ cx: 8, cy: 8, r: 3.5 },
			{ cx: 16.5, cy: 10, r: 3 }
		],
		paths: ['M2 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2']
	},
	settings: {
		paths: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3'],
		circles: [
			{ cx: 4, cy: 14, r: 2 },
			{ cx: 12, cy: 10, r: 2 },
			{ cx: 20, cy: 8, r: 2 }
		]
	},
	calendar: {
		rects: [{ x: 3, y: 4, width: 18, height: 17, rx: 2 }],
		lines: [
			{ x1: 8, y1: 2, x2: 8, y2: 6 },
			{ x1: 16, y1: 2, x2: 16, y2: 6 },
			{ x1: 3, y1: 10, x2: 21, y2: 10 }
		]
	},
	swords: {
		lines: [
			{ x1: 4, y1: 4, x2: 20, y2: 20 },
			{ x1: 20, y1: 4, x2: 4, y2: 20 }
		]
	},
	clipboard: {
		rects: [
			{ x: 6, y: 4, width: 12, height: 16, rx: 2 },
			{ x: 9, y: 2, width: 6, height: 4, rx: 1 }
		]
	},
	flame: {
		paths: [
			'M12 2c3 3 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9z',
			'M12 11c1.5 2 3 3.5 3 5a3 3 0 0 1-6 0c0-1.5 1.5-3 3-5z'
		]
	},
	crown: {
		paths: ['M3 7l4 6 5-7 5 7 4-6v10H3z']
	},
	lock: {
		rects: [{ x: 5, y: 11, width: 14, height: 10, rx: 2 }],
		paths: ['M7 11V8a5 5 0 0 1 10 0v3']
	},
	image: {
		rects: [{ x: 3, y: 5, width: 18, height: 14, rx: 2 }],
		circles: [{ cx: 8, cy: 10, r: 2 }],
		paths: ['M21 17l-5-5-4 4-3-3-6 6']
	},
	camera: {
		paths: ['M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z'],
		circles: [{ cx: 12, cy: 13, r: 3 }]
	},
	refresh: {
		paths: ['M4 4v6h6', 'M20 20v-6h-6', 'M5 10a7 7 0 0 1 11-3', 'M19 14a7 7 0 0 1-11 3']
	},
	mapPin: {
		paths: ['M12 22s7-5 7-11a7 7 0 1 0-14 0c0 6 7 11 7 11z'],
		circles: [{ cx: 12, cy: 11, r: 2.5 }]
	},
	map: {
		paths: ['M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z', 'M9 4v14', 'M15 6v14']
	},
	paw: {
		circles: [
			{ cx: 7, cy: 7, r: 2 },
			{ cx: 12, cy: 5.5, r: 2 },
			{ cx: 17, cy: 7, r: 2 },
			{ cx: 9.5, cy: 11, r: 2 }
		],
		paths: ['M12 21c-3.3 0-6-2.2-6-5 0-3 2.7-5 6-5s6 2 6 5c0 2.8-2.7 5-6 5z']
	},
	faceSad: {
		circles: [
			{ cx: 12, cy: 12, r: 9 },
			{ cx: 9, cy: 10, r: 1 },
			{ cx: 15, cy: 10, r: 1 }
		],
		paths: ['M8 17c1.5-2 6.5-2 8 0']
	},
	heartBroken: {
		paths: [
			'M12 21s-7-4.5-9-8.5a5 5 0 0 1 8-5 5 5 0 0 1 8 5c-2 4-9 8.5-9 8.5z',
			'M12 8l-1 2 2 2-2 2 2 2'
		]
	},
	skull: {
		paths: [
			'M12 2c-4.4 0-8 3.1-8 7 0 3.2 2.3 5.9 5.5 6.7V20h5v-4.3C17.7 14.9 20 12.2 20 9c0-3.9-3.6-7-8-7z',
			'M10 20v2',
			'M14 20v2'
		],
		circles: [
			{ cx: 9, cy: 11, r: 1.2 },
			{ cx: 15, cy: 11, r: 1.2 }
		]
	},
	sparkles: {
		paths: [
			'M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z',
			'M4 12l.8 2.2L7 15l-2.2.8L4 18l-.8-2.2L1 15l2.2-.8L4 12z'
		]
	},
	target: {
		circles: [
			{ cx: 12, cy: 12, r: 8 },
			{ cx: 12, cy: 12, r: 3 }
		],
		lines: [
			{ x1: 12, y1: 4, x2: 12, y2: 8 },
			{ x1: 12, y1: 16, x2: 12, y2: 20 },
			{ x1: 4, y1: 12, x2: 8, y2: 12 },
			{ x1: 16, y1: 12, x2: 20, y2: 12 }
		]
	},
	smile: {
		circles: [
			{ cx: 12, cy: 12, r: 9 },
			{ cx: 9, cy: 10, r: 1 },
			{ cx: 15, cy: 10, r: 1 }
		],
		paths: ['M8 15c1.5 2 6.5 2 8 0']
	},
	checkCircle: {
		circles: [{ cx: 12, cy: 12, r: 9 }],
		paths: ['M8 12l2.5 2.5L16 9']
	},
	xCircle: {
		circles: [{ cx: 12, cy: 12, r: 9 }],
		paths: ['M9 9l6 6', 'M15 9l-6 6']
	},
	help: {
		circles: [
			{ cx: 12, cy: 12, r: 9 },
			{ cx: 12, cy: 17, r: 1 }
		],
		paths: ['M9 9a3 3 0 1 1 6 1c0 2-2 2-2 3']
	},
	clock: {
		circles: [{ cx: 12, cy: 12, r: 9 }],
		paths: ['M12 7v5l3 2']
	},
	flag: {
		paths: ['M5 3v18', 'M5 3h12l-2 4 2 4H5']
	},
	shield: {
		paths: ['M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z']
	},
	arrowUpRight: {
		paths: ['M7 17L17 7', 'M7 7h10v10']
	},
	logOut: {
		paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9']
	},
	palette: {
		circles: [
			{ cx: 7.5, cy: 10.5, r: 1 },
			{ cx: 12, cy: 8, r: 1 },
			{ cx: 16.5, cy: 11, r: 1 },
			{ cx: 14.5, cy: 15, r: 1 }
		],
		paths: [
			'M12 3a9 9 0 0 0-9 9c0 2.4 1 4.6 2.7 6.2 1 1 1.5 2.4 1.3 3.8-.1.8.5 1.5 1.3 1.5H12a2 2 0 0 0 2-2c0-1.1.9-2 2-2h1a6 6 0 0 0 0-12h-5z'
		]
	}
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof icons;
