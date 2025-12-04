import type { Socket, Namespace } from 'socket.io';

export function setupVersusHandlers(socket: Socket, _namespace: Namespace) {
	// Join a challenge room
	socket.on('versus:join', ({ challengeId }: { challengeId: number }) => {
		const room = `challenge:${challengeId}`;
		socket.join(room);
		console.log(`Socket ${socket.id} joined ${room}`);

		// Notify others in the room
		socket.to(room).emit('versus:opponent_joined', {
			socketId: socket.id
		});
	});

	// Leave a challenge room
	socket.on('versus:leave', ({ challengeId }: { challengeId: number }) => {
		const room = `challenge:${challengeId}`;
		socket.leave(room);
		console.log(`Socket ${socket.id} left ${room}`);

		socket.to(room).emit('versus:opponent_left', {
			socketId: socket.id
		});
	});

	// Player ready to start
	socket.on('versus:ready', ({ challengeId }: { challengeId: number }) => {
		const room = `challenge:${challengeId}`;
		socket.to(room).emit('versus:opponent_ready');

		// TODO: Check if both players ready, then emit match_start with pictures
	});

	// Submit round guess
	socket.on(
		'versus:submit',
		async ({
			challengeId,
			roundNumber,
			latitude,
			longitude,
			timeSeconds
		}: {
			challengeId: number;
			roundNumber: number;
			latitude: number;
			longitude: number;
			timeSeconds: number;
		}) => {
			const room = `challenge:${challengeId}`;

			// TODO: Validate and calculate score
			// For now, emit placeholder
			socket.to(room).emit('versus:opponent_submitted', {
				roundNumber
				// opponentPoints will be calculated server-side
			});

			console.log(`Versus submit: challenge ${challengeId}, round ${roundNumber}`);
		}
	);

	socket.on('disconnect', () => {
		// TODO: Handle disconnect - notify opponent if in active match
		console.log(`Versus socket disconnected: ${socket.id}`);
	});
}
