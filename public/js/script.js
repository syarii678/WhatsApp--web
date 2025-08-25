document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const qrcodeElement = document.getElementById('qrcode');
    const refreshBtn = document.getElementById('refreshBtn');
    const helpBtn = document.getElementById('helpBtn');
    
    // Connect to server
    const socket = io();
    
    // Handle QR code generation
    socket.on('qr', (qrCode) => {
        generateQRCode(qrCode);
        updateStatus('waiting', 'Scan QR code untuk menghubungkan');
    });
    
    // Handle status updates
    socket.on('status', (status) => {
        updateStatus(status.state, status.message);
    });
    
    // Handle connection events
    socket.on('connected', () => {
        updateStatus('connected', 'Terhubung ke WhatsApp');
    });
    
    socket.on('disconnected', () => {
        updateStatus('disconnected', 'Terputus dari WhatsApp');
    });
    
    // Generate QR code display
    function generateQRCode(text) {
        qrcodeElement.innerHTML = '';
        QRCode.toCanvas(qrcodeElement, text, {
            width: 200,
            height: 200,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        }, function(error) {
            if (error) console.error(error);
        });
    }
    
    // Update status display
    function updateStatus(status, message) {
        statusElement.innerHTML = '';
        
        const icon = document.createElement('i');
        const text = document.createElement('span');
        
        text.textContent = message;
        
        if (status === 'connected') {
            statusElement.className = 'status connected';
            icon.className = 'fas fa-check-circle';
        } else if (status === 'disconnected') {
            statusElement.className = 'status disconnected';
            icon.className = 'fas fa-times-circle';
        } else {
            statusElement.className = 'status';
            icon.className = 'fas fa-sync-alt fa-spin';
        }
        
        statusElement.appendChild(icon);
        statusElement.appendChild(text);
    }
    
    // Event listeners untuk tombol
    refreshBtn.addEventListener('click', function() {
        socket.emit('refresh-qr');
    });
    
    helpBtn.addEventListener('click', function() {
        alert('Jika mengalami masalah dalam pairing, pastikan Anda menggunakan aplikasi WhatsApp terbaru dan koneksi internet stabil.');
    });
});