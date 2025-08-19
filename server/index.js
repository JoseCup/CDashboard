require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));

const USERS = [{ id: 1, email: 'admin@example.com', password: 'ChangeMeNow!', role: 'admin', name: 'Jose' },
{ id: 2, email: 'client@example.com', password: 'ChangeMeNow!', role: 'client', name: 'Client' }
];

function sign(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}
function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
    catch { return res.status(401).json({ message: 'Invalid token' }); }
}

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.post('/api/login', (req, res) => {
    const { email, password } = req.body || {};
    const user = USERS.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ message: 'Bad credentials' });
    // Adding name to the token payload
    const token = sign({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
    });
    res.cookie('token', token, {
        httpOnly: true, sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000
    });
    res.json({ message: 'ok' });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token', { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ message: 'logged out' });
});

app.get('/api/me', verifyToken, (req, res) => res.json(req.user));

app.get('/api/dashboard', verifyToken, (req, res) => {
    res.json({ websiteVisits: 1234, leads: 42, conversionRate: '3.4%' });
});

app.listen(process.env.PORT || 5000, () =>
    console.log(`API on http://localhost:${process.env.PORT || 5000}`)
);
