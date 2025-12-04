// Haversine formula to calculate distance between two points in meters

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
	return degrees * (Math.PI / 180);
}

export function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_RADIUS_METERS * c;
}

export function formatDistance(meters: number): string {
	if (meters < 1) {
		return '< 1m';
	}
	if (meters < 1000) {
		return `${Math.round(meters)}m`;
	}
	return `${(meters / 1000).toFixed(2)}km`;
}

// Scoring functions from legacy app
export function calculateDailyPoints(distanceMeters: number): number {
	if (distanceMeters < 3) return 1500;
	if (distanceMeters < 6) return 1250;
	if (distanceMeters < 10) return 1000;
	return Math.max(0, Math.floor((1 - distanceMeters / 110) * 1000));
}

export function calculateVersusPoints(
	distanceMeters: number,
	timeSeconds: number
): number {
	if (distanceMeters < 10 && timeSeconds < 10) return 1000;
	const distancePoints = Math.max(0, 1 - distanceMeters / 110) * 900;
	const timePoints = Math.max(0, 1 - timeSeconds / 120) * 100;
	return Math.floor(distancePoints + timePoints);
}
