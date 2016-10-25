'use strict';

/**
 * Command line script that generates a SQLite database file that contains jokes about Chuck Norris using the
 * wonderful http://api.icndb.com/jokes APIs
 *
 * Usage:
 *
 *   node databaseGenerator.js [destFile]
 *
 *   destFile is optional and it will default to "norrisbot.db"
 *
 * @author Luciano Mammino <lucianomammino@gmail.com>
 */

var path = require('path');
var sqlite3 = require('sqlite3').verbose();

var outputFile = process.argv[2] || path.resolve(__dirname, 'lunchbot.db');
var db = new sqlite3.Database(outputFile);

var check;
db.serialize(function() {
    db.run('CREATE TABLE IF NOT EXISTS user_mapping (slackid TEXT PRIMARY KEY, username_in_doc TEXT DEFAULT NULL)');
    db.run('CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, user_slackid TEXT, order_number TEXT)');
});

db.close();


