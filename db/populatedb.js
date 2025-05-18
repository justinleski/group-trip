#! /usr/bin/env node

const { Client } = require("pg");

const SQL = `

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username VARCHAR( 255 ) NOT NULL,
    password VARCHAR( 255 ) NOT NULL
);

CREATE TABLE friendships (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    friend_id INT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE TABLE trips (
    


);

CREATE TABLE trip_participants (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, trip_id),
);

CREATE TABLE transactions (
    amount INTEGER NOT NULL,

);


`;