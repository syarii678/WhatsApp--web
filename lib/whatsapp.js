const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { execSync } = require('child_process');
const fs = require('fs');

// Deteksi environment (Termux/Android atau lainnya)
const isTermux = process.env.TERMUX_VERSION !== undefined;

class WhatsAppClient {
    constructor() {
        this.client = null;
        this.ready = false;
        this.qrCode = null;
    }

    initialize(io) {
        console.log('Initializing WhatsApp client...');
        
        // Konfigurasi dasar untuk puppeteer
        const puppeteerOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions'
            ]
        };

        // Jika di Termux, cari path Chromium yang benar
        if (isTermux) {
            try {
                // Coba cari path Chromium dengan which command
                const chromiumPath = execSync('which chromium || which chromium-browser', { 
                    encoding: 'utf8' 
                }).trim();
                
                if (chromiumPath) {
                    puppeteerOptions.executablePath = chromiumPath;
                    console.log('Using Chromium at:', chromiumPath);
                } else {
                    console.error('Chromium not found. Please install it with: pkg install chromium');
                    io.emit('status', { 
                        state: 'error', 
                        message: 'Chromium not installed. Run: pkg install chromium' 
                    });
                    return;
                }
            } catch (error) {
                console.error('Error finding Chromium:', error.message);
                io.emit('status', { 
                    state: 'error', 
                    message: 'Error finding Chromium. Run: pkg install chromium' 
                });
                return;
            }
            
            // Tambahkan argumen khusus untuk Termux
            puppeteerOptions.args.push('--disable-features=VizDisplayCompositor');
        }

        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: isTermux ? './.wwebjs_auth' : '/tmp'
            }),
            puppeteer: puppeteerOptions,
            // Tambahkan timeout yang lebih panjang untuk Termux
            restartOnAuthFail: true,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 60000,
            qrMaxRetries: 10
        });

        this.client.on('qr', async (qr) => {
            console.log('QR Received');
            this.qrCode = qr;
            
            try {
                // Generate QR code sebagai data URL
                const qrImage = await qrcode.toDataURL(qr);
                io.emit('qr', qrImage);
                io.emit('status', { state: 'waiting', message: 'Scan QR code untuk menghubungkan' });
                console.log('QR code generated and sent to client');
            } catch (error) {
                console.error('Error generating QR code:', error);
                
                // Fallback: kirim QR code sebagai teks
                io.emit('qr-text', qr);
                io.emit('status', { state: 'waiting', message: 'Scan QR code untuk menghubungkan' });
            }
        });

        this.client.on('ready', () => {
            console.log('Client is ready!');
            this.ready = true;
            this.qrCode = null;
            io.emit('status', { state: 'connected', message: 'Terhubung ke WhatsApp' });
            io.emit('connected');
        });

        this.client.on('authenticated', () => {
            console.log('Authenticated');
            this.qrCode = null;
            io.emit('status', { state: 'authenticated', message: 'Autentikasi berhasil' });
        });

        this.client.on('auth_failure', (msg) => {
            console.error('Authentication failure:', msg);
            io.emit('status', { state: 'disconnected', message: 'Autentikasi gagal' });
            io.emit('disconnected');
        });

        this.client.on('disconnected', (reason) => {
            console.log('Client disconnected:', reason);
            this.ready = false;
            io.emit('status', { state: 'disconnected', message: 'Terputus dari WhatsApp' });
            io.emit('disconnected');
            
            // Try to reconnect after 5 seconds
            setTimeout(() => {
                this.client.initialize();
            }, 5000);
        });

        // Handle messages
        this.client.on('message', message => {
            console.log('Pesan diterima:', message.body);
            
            // Contoh command sederhana
            if (message.body.toLowerCase() === '!ping') {
                message.reply('pong');
            }
            
            if (message.body.toLowerCase() === '!info') {
                message.reply('Ini adalah bot WhatsApp yang dibuat menggunakan whatsapp-web.js');
            }
        });

        // Initialize
        try {
            this.client.initialize();
            console.log('WhatsApp client initialization started');
        } catch (error) {
            console.error('Error initializing client:', error);
            io.emit('status', { 
                state: 'error', 
                message: 'Gagal menginisialisasi bot: ' + error.message 
            });
        }
        
        return this.client;
    }

    getClient() {
        return this.client;
    }

    isReady() {
        return this.ready;
    }

    getQrCode() {
        return this.qrCode;
    }
}

module.exports = WhatsAppClient;
