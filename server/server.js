import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// Initialize Database Schema
const schemaPath = join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, (err) => {
    if (err) console.error("Error executing schema:", err);
    else console.log("Database schema initialized.");
  });
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTHENTICATION ROUTES ---
app.post('/auth/signup', (req, res) => {
  const { email, password, name, age, phone, location, language } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`INSERT INTO users (email, password_hash) VALUES (?, ?)`, [email, hashedPassword], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: err.message });
    }
    
    const userId = this.lastID;
    
    db.run(
      `INSERT INTO profiles (user_id, name, age, phone, location, language) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, age, phone, location, language || 'en'],
      (err) => {
        if (err) return res.status(500).json({ error: "Failed to create profile" });
        
        const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: userId, email } });
      }
    );
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  });
});

app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// --- DATA ROUTES ---
app.get('/api/profiles', authenticateToken, (req, res) => {
  db.get(`SELECT * FROM profiles WHERE user_id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.put('/api/profiles', authenticateToken, (req, res) => {
  const { name, age, phone, location, language } = req.body;
  db.run(
    `UPDATE profiles SET name = ?, age = ?, phone = ?, location = ?, language = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
    [name, age, phone, location, language, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Add similar routes for expenses, loans, income_profiles, etc.

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
