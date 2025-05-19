const { Router } = require("express");
const tripOverviewRouter = Router();
const {
	renderTrips,
	renderNewForm,
	handleCreateTrip,
	renderTripDetails,
	handleAddTransaction,
	renderAddTransactionForm,
} = require("../controllers/tripOverviewController");

//gets
tripOverviewRouter.get("/", renderTrips);
tripOverviewRouter.get("/new", renderNewForm);
tripOverviewRouter.get("/:tripId", renderTripDetails);
tripOverviewRouter.get("/:tripId/add-transaction", renderAddTransactionForm);

// posts
tripOverviewRouter.post("/", handleCreateTrip);
tripOverviewRouter.post("/:tripId/add-transaction", handleAddTransaction);

module.exports = tripOverviewRouter;
