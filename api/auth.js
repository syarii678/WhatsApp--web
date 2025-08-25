const express = require('express');
const router = express.Router();

// Store phone numbers (in production, use a database)
const phoneNumbers = new Map();

// Endpoint to register phone number
router.post('/register-phone', (req, res) => {
    const { phone } = req.body;
    
    if (!phone || !/^[0-9]{8,15}$/.test(phone)) {
        return res.status(400).json({ error: 'Nomor telepon tidak valid' });
    }
    
    // Store phone number with timestamp
    phoneNumbers.set(phone, {
        registeredAt: new Date(),
        paired: false
    });
    
    console.log(`Phone number registered: +${phone}`);
    res.json({ success: true, message: 'Nomor telepon terdaftar' });
});

// Endpoint to check if phone is registered
router.get('/check-phone/:phone', (req, res) => {
    const { phone } = req.params;
    
    if (phoneNumbers.has(phone)) {
        res.json({ registered: true, data: phoneNumbers.get(phone) });
    } else {
        res.json({ registered: false });
    }
});

module.exports = router;
