// --- 1. Dependencies ---
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');

// --- 2. Create Express App ---
const app = express();
// CHANGE 1: Use Render's PORT environment variable
const port = process.env.PORT || 3001;

// --- 3. Middleware Setup ---
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// CHANGE 2: Serve files from the main project folder, not 'public'
app.use(express.static(__dirname));

// --- 4. PostgreSQL Database Connection Pool ---
const connectionString = 'postgresql://neondb_owner:npg_WF3C0tNMDfAX@ep-flat-tree-adx0kbkd-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString: connectionString,
});

pool.connect()
    .then(() => console.log(`\n\n[DATABASE] Connected successfully to Neon PostgreSQL database!\n`))
    .catch(err => console.error('CRITICAL DATABASE CONNECTION ERROR:', err.stack));

// --- 5. Multer setup for file storage ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// =================================================================
// === AUTHENTICATION & PROFILE APIs ===============================
// (No changes needed in the APIs below this point)
// =================================================================
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    try {
        const sql = `SELECT u.id as user_id, u.name, u.email, u.password, u.role, s.id as staff_id, s.profile_picture_url, s.department FROM users u LEFT JOIN staff s ON u.email = s.email WHERE u.email = $1`;
        const { rows: users } = await pool.query(sql, [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
        }
        const user = users[0];
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
        }
        res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: { id: user.staff_id, name: user.name, email: user.email, role: user.role, department: user.department, profile_picture_url: user.profile_picture_url }
        });
    } catch (err) {
        console.error("❌ CRITICAL LOGIN ERROR:", err);
        res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});

// ... (Your other APIs will remain here as they were) ...
// The rest of your server.js file remains the same. The only changes are at the top.

// Example of another API route (no changes needed)
app.get('/api/profile', async (req, res) => {
    // ... your existing code
});


// --- Start Server --- 
app.listen(port, () => {
    console.log(`✅ Campus Connect backend server is running on port: ${port}`);
});