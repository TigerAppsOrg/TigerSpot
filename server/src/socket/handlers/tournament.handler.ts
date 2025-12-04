import type { Socket, Namespace } from 'socket.io';

export function setupTournamentHandlers(socket: Socket, _namespace: Namespace) {
	// Join tournament room (for bracket updates)
	socket.on('tournament:join', ({ tournamentId }: { tournamentId: number }) => {
		const room = `tournament:${tournamentId}`;
		socket.join(room);
		console.log(`Socket ${socket.id} joined ${room}`);
	});

	// Leave tournament room
	socket.on('tournament:leave', ({ tournamentId }: { tournamentId: number }) => {
		const room = `tournament:${tournamentId}`;
		socket.leave(room);
		console.log(`Socket ${socket.id} left ${room}`);
	});

	// Join specific match room
	socket.on('tournament:match_join', ({ matchId }: { matchId: number }) => {
		const room = `match:${matchId}`;
		socket.join(room);
		console.log(`Socket ${socket.id} joined match room ${room}`);

		socket.to(room).emit('tournament:opponent_joined', {
			socketId: socket.id
		});
	});

	// Submit round guess
	socket.on(
		'tournament:submit',
		async ({
			matchId,
			roundNumber,
			latitude,
			longitude,
			timeSeconds
		}: {
			matchId: number;
			roundNumber: number;
			latitude: number;
			longitude: number;
			timeSeconds: number;
		}) => {
			const room = `match:${matchId}`;

			// TODO: Validate and calculate score, update database
			socket.to(room).emit('tournament:score_update', {
				matchId,
				roundNumber
				// scores will be calculated server-side
			});

			console.log(`Tournament submit: match ${matchId}, round ${roundNumber}`);
		}
	);

	socket.on('disconnect', () => {
		console.log(`Tournament socket disconnected: ${socket.id}`);
	});
}
