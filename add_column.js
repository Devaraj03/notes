const Database = require('better-sqlite3');
const db = new Database('notes.db');

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
