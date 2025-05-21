const express = require("express");
const path = require("node:path");
const app = express();
const pool = require("./db/pool");
const session = require("express-session");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;

passport.use(
	new LocalStrategy(async (username, password, done) => {
		try {
			const lowerUsername = username.toLowerCase();
			const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [lowerUsername]);
			const user = rows[0];

			if (!user) {
				return done(null, false, { message: "Incorrect username" });
			}
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return done(null, false, { message: "Incorrect password" });
			}
			return done(null, user);
		} catch (err) {
			return done(err);
		}
	})
);

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
		const user = rows[0];

		done(null, user);
	} catch (err) {
		done(err);
	}
});

app.post(
	"/log-in",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/",
	})
);

// routers
const indexRouter = require("./routes/indexRouter");
const signUpRouter = require("./routes/signUpRouter");
const signInRouter = require("./routes/signInRouter");
const signOutRouter = require("./routes/signOutRouter");
const accountRouter = require("./routes/accountRouter");
const tripOverviewRouter = require("./routes/tripOverviewRouter");
const inviteRouter = require("./routes/inviteRouter");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
	session({
		secret: "cats",
		resave: false,
		saveUninitialized: false,
	})
);
app.use("/bi", express.static(__dirname + "/node_modules/bootstrap-icons/font"));

app.use(passport.initialize());
app.use(passport.session());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ------------
app.use("/", indexRouter);
app.use("/sign-up", signUpRouter);
app.use("/sign-in", signInRouter);
app.use("/sign-out", signOutRouter);
app.use("/account", accountRouter);
app.use("/trip-overview", tripOverviewRouter);
app.use("/invite", inviteRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`GroupTrip - listening on port ${PORT}!`);
});
