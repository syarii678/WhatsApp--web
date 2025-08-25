const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const WhatsAppClient = require('../lib/whatsapp');

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

// Initialize WhatsApp client
const whatsappClient = new WhatsAppClient();
whatsappClient.initialize(io);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
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
            whatsappClient.getClient().initialize();
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