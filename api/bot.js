const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const WhatsAppClient = require('../lib/whatsapp');
const authRoutes = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// Initialize WhatsApp client
const whatsappClient = new WhatsAppClient();
whatsappClient.initialize(io);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Handle phone registration
    socket.on('register-phone', (data) => {
        console.log('Phone registered via socket:', data.phone);
        // You can store this information or link it to the socket
        socket.phoneNumber = data.phone;
    });
    
    // Send current QR code if available
    const currentQr = whatsappClient.getQrCode();
    if (currentQr) {
        qrcode.toDataURL(currentQr, (err, url) => {
            if (!err) {
                socket.emit('qr', url);
                socket.emit('status', { state: 'waiting', message: 'Scan QR code untuk menghubungkan' });
            }
        });
    }
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
    
    socket.on('refresh-qr', () => {
        if (whatsappClient.isReady()) {
            socket.emit('status', { state: 'connected', message: 'Sudah terhubung ke WhatsApp' });
        } else {
            socket.emit('status', { state: 'waiting', message: 'Meminta QR code baru...' });
            // Force a new QR code by reinitializing
            whatsappClient.getClient().destroy();
            setTimeout(() => {
                whatsappClient.getClient().initialize();
            }, 1000);
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        whatsapp: whatsappClient.isReady() ? 'connected' : 'disconnected' 
    });
});

// Get QR code endpoint
app.get('/api/qrcode', async (req, res) => {
    try {
        const qrCode = whatsappClient.getQrCode();
        if (qrCode) {
            const qrImage = await qrcode.toDataURL(qrCode);
            res.json({ qrCode: qrImage });
        } else {
            res.status(404).json({ error: 'QR code not available' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Handle messages
app.post('/api/send-message', (req, res) => {
    if (!whatsappClient.isReady()) {
        return res.status(400).json({ error: 'WhatsApp client not ready' });
    }
    
    const { number, message } = req.body;
    
    if (!number || !message) {
        return res.status(400).json({ error: 'Number and message are required' });
    }
    
    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    
    whatsappClient.getClient().sendMessage(chatId, message)
        .then(response => {
            res.json({ success: true, messageId: response.id._serialized });
        })
        .catch(error => {
            console.error('Error sending message:', error);
            res.status(500).json({ error: 'Failed to send message' });
        });
});

// Export for Vercel
module.exports = app;
