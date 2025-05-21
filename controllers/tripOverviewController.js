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
		const result = await pool.query(`INSERT INTO trips (name) VALUES ($1) RETURNING id`, [tripName]);
		const tripId = result.rows[0].id;

		// 2. Add current user as participant
		await pool.query(`INSERT INTO trip_participants (user_id, trip_id) VALUES ($1, $2)`, [req.user.id, tripId]);

		// 3. Redirect to overview
		res.redirect("/trip-overview");
	} catch (err) {
		console.error(err);
		res.status(500).send("Server error");
	}
}

async function renderTripDetails(req, res) {
	const { tripId } = req.params;
	const userId = req.user.id;

	// Make sure user is part of this trip
	const accessCheck = await pool.query(`SELECT 1 FROM trip_participants WHERE trip_id = $1 AND user_id = $2`, [
		tripId,
		userId,
	]);
	if (accessCheck.rowCount === 0) {
		return res.status(403).send("You are not part of this trip.");
	}

	// Get trip name to display to users
	const tripQuery = await pool.query(`SELECT name FROM trips WHERE id = $1`, [tripId]);
	const tripName = tripQuery.rows[0].name;

	// get name of all people going based on tripId'
	const { rows: participants } = await pool.query(
		`SELECT u.id, u.username
		FROM trip_participants tp
		JOIN users u ON tp.user_id = u.id
		WHERE tp.trip_id = $1;
		`,
		[tripId]
	);

	// Get transactions with payer username
	const { rows: rawTransactions } = await pool.query(
		`
		SELECT t.id, t.name, t.amount, t.paid_off, u.username AS payer
		FROM transactions t
		JOIN users u ON t.payer_id = u.id
		WHERE t.trip_id = $1
		ORDER BY t.id DESC;
		`,
		[tripId]
	);

	// For each transaction, get how much the logged-in user owes and has paid
	const transactions = await Promise.all(
		rawTransactions.map(async (tx) => {
			const result = await pool.query(
				`
				SELECT amount_owed, amount_paid
				FROM transaction_shares
				WHERE transaction_id = $1 AND user_id = $2
				`,
				[tx.id, userId]
			);

			const share = result.rows[0];
			const userOwes = parseFloat(share?.amount_owed || 0);
			const userPaid = parseFloat(share?.amount_paid || 0);
			const remaining = Math.max(userOwes - userPaid, 0);

			return {
				...tx,
				userOwes,
				userPaid,
				remaining,
			};
		})
	);

	let totalSpent = 0;
	let totalOwed = 0;

	for (const tx of transactions) {
		totalSpent += parseFloat(tx.amount || 0);

		const res = await pool.query(
			`SELECT SUM(amount_owed - amount_paid) AS still_owed
		 	FROM transaction_shares
		 	WHERE transaction_id = $1`,
			[tx.id]
		);

		totalOwed += parseFloat(res.rows[0].still_owed || 0);
	}

	res.render("tripDetails", {
		title: "Trip Transactions",
		tripId,
		transactions,
		totalSpent,
		totalOwed,
		tripName,
		participants,
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
	const accessCheck = await pool.query(`SELECT * FROM trip_participants WHERE trip_id = $1 AND user_id = $2`, [
		tripId,
		req.user.id,
	]);
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

async function handlePayment(req, res) {
	try {
		const { tripId, transactionId } = req.params;
		const userId = req.user.id;
		const amount = parseFloat(req.body.amount);

		if (isNaN(amount) || amount <= 0) {
			return res.status(400).send("Invalid payment amount.");
		}

		// Fetch current owed/paid status for this user
		const { rows } = await pool.query(
			`SELECT amount_owed, amount_paid FROM transaction_shares
			 WHERE transaction_id = $1 AND user_id = $2`,
			[transactionId, userId]
		);

		if (rows.length === 0) {
			return res.status(403).send("You're not part of this transaction.");
		}

		const { amount_owed, amount_paid } = rows[0];
		const remaining = parseFloat(amount_owed) - parseFloat(amount_paid);

		if (amount > remaining) {
			return res.status(400).send("You cannot overpay your share.");
		}

		// Update user's amount_paid
		const newPaid = parseFloat(amount_paid) + amount;
		await pool.query(
			`UPDATE transaction_shares SET amount_paid = $1
			 WHERE transaction_id = $2 AND user_id = $3`,
			[newPaid, transactionId, userId]
		);

		// Check if the transaction is fully paid by all users
		const result = await pool.query(
			`SELECT SUM(amount_paid) AS paid_total, SUM(amount_owed) AS owed_total
			 FROM transaction_shares WHERE transaction_id = $1`,
			[transactionId]
		);

		const { paid_total, owed_total } = result.rows[0];
		if (parseFloat(paid_total) >= parseFloat(owed_total)) {
			await pool.query(`UPDATE transactions SET paid_off = TRUE WHERE id = $1`, [transactionId]);
		}

		res.redirect(`/trip-overview/${tripId}`);
	} catch (err) {
		console.error("Error processing payment:", err);
		res.status(500).send("Server error during payment.");
	}
}

module.exports = {
	renderTrips,
	renderNewForm,
	handleCreateTrip,
	renderTripDetails,
	handleAddTransaction,
	renderAddTransactionForm,
	handlePayment,
};
