#! /usr/bin/env node

const { Client } = require("pg");
require("dotenv").config();

const SQL = `

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username VARCHAR( 255 ) UNIQUE NOT NULL CHECK (username = lower(username)),
    password VARCHAR( 255 ) NOT NULL
);

CREATE TABLE friendships (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    friend_id INT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE TABLE trips (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR( 255 ) NOT NULL
);

CREATE TABLE trip_participants (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, trip_id)
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    amount INTEGER NOT NULL,
    name VARCHAR( 255 ) NOT NULL,
    shared BOOLEAN,
    paid_off BOOLEAN DEFAULT false,
    trip_id INT REFERENCES trips(id) ON DELETE CASCADE
);
`;

async function main() {
	console.log("Seeding...");
	const client = new Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();
	await client.query(SQL);
	await client.end();
	console.log("Done.");
}

main();
