// Dummy data for frontend development

export const dummyUser = {
	username: 'tiger123',
	totalPoints: 5420,
	currentStreak: 7,
	isAdmin: true // Set to true for admin dashboard access
};

export const dummyPictures = [
	{
		id: 1,
		imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop',
		latitude: 40.3431,
		longitude: -74.6551
	},
	{
		id: 2,
		imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop',
		latitude: 40.3465,
		longitude: -74.6576
	},
	{
		id: 3,
		imageUrl: 'https://images.unsplash.com/photo-1568792923760-d70635a89fdc?w=800&h=600&fit=crop',
		latitude: 40.3485,
		longitude: -74.6593
	},
	{
		id: 4,
		imageUrl: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&h=600&fit=crop',
		latitude: 40.3441,
		longitude: -74.6603
	},
	{
		id: 5,
		imageUrl: 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=800&h=600&fit=crop',
		latitude: 40.3502,
		longitude: -74.6512
	}
];

export const dummyLeaderboard = [
	{ rank: 1, username: 'ptonpro', points: 12500, streak: 15 },
	{ rank: 2, username: 'tiger88', points: 11200, streak: 12 },
	{ rank: 3, username: 'nassau_nav', points: 10800, streak: 10 },
	{ rank: 4, username: 'campus_king', points: 9500, streak: 8 },
	{ rank: 5, username: 'firestone_fan', points: 8900, streak: 6 },
	{ rank: 6, username: 'orange_black', points: 7600, streak: 5 },
	{ rank: 7, username: 'tiger123', points: 5420, streak: 7 },
	{ rank: 8, username: 'chapel_champ', points: 4800, streak: 3 },
	{ rank: 9, username: 'ivy_explorer', points: 4200, streak: 2 },
	{ rank: 10, username: 'newbie_nav', points: 3100, streak: 1 }
];

// Available players pool for versus mode
export const dummyVersusPlayers = [
	'ptonpro',
	'tiger88',
	'nassau_nav',
	'campus_king',
	'firestone_fan',
	'orange_black',
	'chapel_champ',
	'ivy_explorer'
];

export const dummyChallenges = [
	{
		id: 1,
		opponent: 'tiger88',
		status: 'pending' as 'pending' | 'accepted' | 'completed',
		isChallenger: true,
		createdAt: new Date(Date.now() - 1000 * 60 * 30)
	},
	{
		id: 2,
		opponent: 'nassau_nav',
		status: 'accepted' as 'pending' | 'accepted' | 'completed',
		isChallenger: false,
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
	},
	{
		id: 3,
		opponent: 'campus_king',
		status: 'completed' as 'pending' | 'accepted' | 'completed',
		isChallenger: true,
		yourScore: 4200,
		theirScore: 3800,
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
	}
];

export const dummyTournaments = [
	{
		id: 1,
		name: 'Spring Showdown 2024',
		status: 'open',
		difficulty: 'mixed',
		participants: 12,
		maxParticipants: 16,
		timeLimit: 30
	},
	{
		id: 2,
		name: 'Freshman Face-Off',
		status: 'in_progress',
		difficulty: 'easy',
		participants: 8,
		maxParticipants: 8,
		timeLimit: 45
	},
	{
		id: 3,
		name: 'Expert Exhibition',
		status: 'completed',
		difficulty: 'hard',
		participants: 16,
		maxParticipants: 16,
		winner: 'ptonpro',
		timeLimit: 20
	}
];

// Active tournament (single tournament at a time)
export const dummyActiveTournament = {
	id: 1,
	name: 'Spring Showdown 2024',
	status: 'in_progress' as 'open' | 'in_progress' | 'completed',
	difficulty: 'mixed' as 'easy' | 'medium' | 'hard' | 'mixed',
	timeLimit: 30,
	roundsPerMatch: 5,
	participants: [
		'tiger123',
		'tiger88',
		'nassau_nav',
		'campus_king',
		'firestone_fan',
		'orange_black',
		'chapel_champ',
		'ivy_explorer'
	],
	createdAt: new Date()
};

// Type for bracket match
export type BracketMatch = {
	id: number;
	player1: string | null;
	player2: string | null;
	player1Score: number | null;
	player2Score: number | null;
	winnerId: string | null;
	status: 'pending' | 'in_progress' | 'completed';
};

// Double elimination bracket structure
export const dummyBracket = {
	winners: [
		// Round 1 (Quarterfinals)
		[
			{
				id: 1,
				player1: 'tiger123',
				player2: 'tiger88',
				player1Score: 4200,
				player2Score: 3800,
				winnerId: 'tiger123',
				status: 'completed'
			},
			{
				id: 2,
				player1: 'nassau_nav',
				player2: 'campus_king',
				player1Score: 4500,
				player2Score: 4100,
				winnerId: 'nassau_nav',
				status: 'completed'
			},
			{
				id: 3,
				player1: 'firestone_fan',
				player2: 'orange_black',
				player1Score: 3900,
				player2Score: 4300,
				winnerId: 'orange_black',
				status: 'completed'
			},
			{
				id: 4,
				player1: 'chapel_champ',
				player2: 'ivy_explorer',
				player1Score: 4000,
				player2Score: 3600,
				winnerId: 'chapel_champ',
				status: 'completed'
			}
		],
		// Round 2 (Semifinals)
		[
			{
				id: 5,
				player1: 'tiger123',
				player2: 'nassau_nav',
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'in_progress'
			},
			{
				id: 6,
				player1: 'orange_black',
				player2: 'chapel_champ',
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'pending'
			}
		],
		// Finals
		[
			{
				id: 7,
				player1: null,
				player2: null,
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'pending'
			}
		]
	] as BracketMatch[][],
	losers: [
		// Losers Round 1 (losers from QF)
		[
			{
				id: 8,
				player1: 'tiger88',
				player2: 'campus_king',
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'pending'
			},
			{
				id: 9,
				player1: 'firestone_fan',
				player2: 'ivy_explorer',
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'pending'
			}
		],
		// Losers Round 2 (winners from LR1 vs losers from SF)
		[
			{
				id: 10,
				player1: null,
				player2: null,
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'pending'
			},
			{
				id: 11,
				player1: null,
				player2: null,
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'pending'
			}
		],
		// Losers Semifinals
		[
			{
				id: 12,
				player1: null,
				player2: null,
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'pending'
			}
		],
		// Losers Finals
		[
			{
				id: 13,
				player1: null,
				player2: null,
				player1Score: null,
				player2Score: null,
				winnerId: null,
				status: 'pending'
			}
		]
	] as BracketMatch[][],
	grandFinal: {
		id: 14,
		player1: null,
		player2: null,
		player1Score: null,
		player2Score: null,
		winnerId: null,
		status: 'pending'
	} as BracketMatch
};

// Current user's active match (if they have one)
export const dummyCurrentMatch = {
	matchId: 5,
	bracketType: 'winners' as 'winners' | 'losers' | 'grand_final',
	roundNumber: 2,
	opponent: 'nassau_nav',
	pictures: dummyPictures // Use the same 5 pictures for the match
};

// Princeton campus bounds for map
export const PRINCETON_BOUNDS = {
	center: { lng: -74.6551, lat: 40.3431 },
	zoom: 16,
	minZoom: 14,
	maxZoom: 19,
	bounds: [
		[-74.68, 40.32], // Southwest
		[-74.63, 40.36] // Northeast
	] as [[number, number], [number, number]]
};
