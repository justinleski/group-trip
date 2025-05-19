const pool = require("./pool");

async function getAllTrips(userId) {
	const { rows } = await pool.query(
		`
		SELECT 
			t.id AS trip_id,
			t.name AS trip_name,
			u.id AS participant_id,
			u.username AS participant_name
		FROM trips t
		JOIN trip_participants tp ON t.id = tp.trip_id
		JOIN users u ON tp.user_id = u.id
		WHERE t.id IN (
			SELECT trip_id FROM trip_participants WHERE user_id = $1
		)
		ORDER BY t.id DESC;
		`,
		[userId]
	);

	// Group trips with participants
	const trips = {};
	for (const row of rows) {
		if (!trips[row.trip_id]) {
			trips[row.trip_id] = {
				id: row.trip_id,
				name: row.trip_name,
				participants: [],
			};
		}
		trips[row.trip_id].participants.push({
			id: row.participant_id,
			username: row.participant_name,
		});
	}
	return Object.values(trips);
}

module.exports = {
	getAllTrips,
};
