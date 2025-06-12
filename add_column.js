const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./notes.db');

db.serialize(() => {
  db.run("ALTER TABLE notes ADD COLUMN created_at TEXT", (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("Column 'created_at' already exists.");
      } else {
        console.error("Error:", err.message);
      }
    } else {
      console.log("Column 'created_at' added successfully.");
    }
  });
});

db.close();
