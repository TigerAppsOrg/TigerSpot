// Dummy data for frontend development

export const dummyUser = {
	username: 'tiger123',
	totalPoints: 5420,
	currentStreak: 7,
	isAdmin: false
};

export const dummyPictures = [
	{
		id: 1,
		imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop',
		latitude: 40.3431,
		longitude: -74.6551,
		placeName: 'Nassau Hall'
	},
	{
		id: 2,
		imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop',
		latitude: 40.3465,
		longitude: -74.6576,
		placeName: 'Firestone Library'
	},
	{
		id: 3,
		imageUrl: 'https://images.unsplash.com/photo-1568792923760-d70635a89fdc?w=800&h=600&fit=crop',
		latitude: 40.3485,
		longitude: -74.6593,
		placeName: 'Princeton Chapel'
	},
	{
		id: 4,
		imageUrl: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800&h=600&fit=crop',
		latitude: 40.3441,
		longitude: -74.6603,
		placeName: 'East Pyne Hall'
	},
	{
		id: 5,
		imageUrl: 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=800&h=600&fit=crop',
		latitude: 40.3502,
		longitude: -74.6512,
		placeName: 'Frist Campus Center'
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

export const dummyChallenges = [
	{
		id: 1,
		opponent: 'tiger88',
		status: 'pending',
		isChallenger: true,
		createdAt: new Date(Date.now() - 1000 * 60 * 30)
	},
	{
		id: 2,
		opponent: 'nassau_nav',
		status: 'accepted',
		isChallenger: false,
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
	},
	{
		id: 3,
		opponent: 'campus_king',
		status: 'completed',
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
