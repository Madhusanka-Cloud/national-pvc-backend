const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

app.use('/uploads', express.static(uploadDir)); 

// Database Setup (SQLite)
const db = new sqlite3.Database('./reports.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

// Create table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    email TEXT,
    category TEXT,
    description TEXT,
    filePath TEXT,
    date TEXT
)`);

// File Upload Setup (Multer)
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        cb(null, 'proof-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API Route: Submit a Report
app.post('/api/reports', upload.single('proof'), (req, res) => {
    const { fullName, email, category, description } = req.body;
    // Normalize path to use forward slashes for URLs
    const filePath = req.file ? req.file.path.replace(/\\/g, "/") : null;
    const date = new Date().toISOString().split('T')[0];

    const sql = `INSERT INTO reports (fullName, email, category, description, filePath, date) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [fullName, email, category, description, filePath, date], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Report saved successfully!", id: this.lastID });
    });
});

// API Route: Get all Reports
app.get('/api/reports', (req, res) => {
    db.all(`SELECT * FROM reports ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});