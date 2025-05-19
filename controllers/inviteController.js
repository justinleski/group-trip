const { v4: uuidv4 } = require("uuid");
const pool = require("../db/pool");

createInvite = async (req, res) => {
	const { tripId } = req.params;

	const token = uuidv4();
	await pool.query("INSERT INTO trip_invites (trip_id, token) VALUES ($1, $2)", [tripId, token]);

	const fullLink = `${req.protocol}://${req.get("host")}/invite/${token}`;
	res.render("inviteLink", { inviteLink: fullLink }); // Or send JSON if using fetch
};

acceptInvite = async (req, res) => {
	const { token } = req.params;

	const result = await pool.query("SELECT trip_id FROM trip_invites WHERE token = $1", [token]);
	if (result.rows.length === 0) return res.status(404).send("Invalid invite link.");

	const tripId = result.rows[0].trip_id;

	if (!req.isAuthenticated()) {
		req.session.redirectAfterLogin = `/invite/${token}`;
		return res.redirect("/login");
	}

	await pool.query("INSERT INTO trip_participants (trip_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
		tripId,
		req.user.id,
	]);

	res.redirect(`/trip-overview/${tripId}`);
};

module.exports = {
	createInvite,
	acceptInvite,
};
