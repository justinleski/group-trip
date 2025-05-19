const { getAllTrips } = require("../db/queries");
const pool = require("../db/pool"); // since we're doing a few simple queries ill just pop it in here

async function renderTrips(req, res) {
	if (!req.user) return res.redirect("/sign-in");
	const trips = await getAllTrips(req.user.id);
	res.render("tripOverview", { user: req.user, trips: trips });
}

async function renderNewForm(req, res) {
	res.render("newTrip", {
		title: "Create a New Trip",
		errors: [],
		enteredTripName: "",
	});
}

async function handleCreateTrip(req, res) {
	const { tripName } = req.body;

	if (!tripName || tripName.trim() === "") {
		return res.render("newTrip", {
			title: "Create a New Trip",
			errors: [{ msg: "Trip name is required" }],
			enteredTripName: tripName,
		});
	}

	try {
		// 1. Insert into trips
		const result = await pool.query(
			`INSERT INTO trips (name) VALUES ($1) RETURNING id`,
			[tripName]
		);
		const tripId = result.rows[0].id;

		// 2. Add current user as participant
		await pool.query(
			`INSERT INTO trip_participants (user_id, trip_id) VALUES ($1, $2)`,
			[req.user.id, tripId]
		);

		// 3. Redirect to overview
		res.redirect("/trip-overview");
	} catch (err) {
		console.error(err);
		res.status(500).send("Server error");
	}
}

async function renderTripDetails(req, res) {
	const { tripId } = req.params;

	const accessCheck = await pool.query(
		`SELECT * FROM trip_participants WHERE trip_id = $1 AND user_id = $2`,
		[tripId, req.user.id]
	);
	if (accessCheck.rowCount === 0) {
		return res.status(403).send("You are not part of this trip.");
	}

	const { rows: transactions } = await pool.query(
		`
		SELECT t.id, t.name, t.amount, t.paid_off, u.username AS payer
		FROM transactions t
		JOIN users u ON t.payer_id = u.id
		WHERE t.trip_id = $1
		ORDER BY t.id DESC;
		`,
		[tripId]
	);

	res.render("tripDetails", {
		title: "Trip Transactions",
		tripId,
		transactions,
	});
}

// POST /trip-overview/:tripId/add-transaction
async function handleAddTransaction(req, res) {
	try {
		const { tripId } = req.params;
		const { name, amount, payer, owes } = req.body;

		// Validate inputs
		if (!name || !amount || !payer || !owes) {
			return res.status(400).send("Missing required fields.");
		}

		// Insert into transactions
		const result = await pool.query(
			`INSERT INTO transactions (name, amount, trip_id, payer_id)
			VALUES ($1, $2, $3, $4) RETURNING id`,
			[name, parseFloat(amount), tripId, payer]
		);
		const transactionId = result.rows[0].id;

		// Insert shares
		const shareInserts = Object.entries(owes).map(([userId, owedAmount]) => {
			const amt = parseFloat(owedAmount);
			if (isNaN(amt) || amt <= 0) return null;

			return pool.query(
				`INSERT INTO transaction_shares (transaction_id, user_id, amount_owed)
				VALUES ($1, $2, $3)`,
				[transactionId, userId, amt]
			);
		});

		await Promise.all(shareInserts.filter(Boolean));

		res.redirect(`/trip-overview/${tripId}`);
	} catch (err) {
		console.error("Error creating transaction:", err);
		res.status(500).send("Server error.");
	}
}

async function renderAddTransactionForm(req, res) {
	const { tripId } = req.params;

	// optional: check if user is in the trip
	const accessCheck = await pool.query(
		`SELECT * FROM trip_participants WHERE trip_id = $1 AND user_id = $2`,
		[tripId, req.user.id]
	);
	if (accessCheck.rowCount === 0) {
		return res.status(403).send("You are not part of this trip.");
	}

	const { rows: participants } = await pool.query(
		`SELECT u.id, u.username
		 FROM users u
		 JOIN trip_participants tp ON tp.user_id = u.id
		 WHERE tp.trip_id = $1`,
		[tripId]
	);

	res.render("addTransaction", { tripId, participants });
}

module.exports = {
	renderTrips,
	renderNewForm,
	handleCreateTrip,
	renderTripDetails,
	handleAddTransaction,
	renderAddTransactionForm,
};
