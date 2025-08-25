document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const qrcodeElement = document.getElementById('qrcode');
    const refreshBtn = document.getElementById('refreshBtn');
    const backBtn = document.getElementById('backBtn');
    const phoneDisplay = document.getElementById('phoneNumberDisplay');
    
    // Get phone number from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const phoneNumber = urlParams.get('phone');
    
    if (phoneNumber) {
        phoneDisplay.textContent = `+${phoneNumber}`;
    } else {
        // Redirect back if no phone number provided
        window.location.href = 'index.html';
        return;
    }
    
    // Connect to server
    const socket = io();
    
    // Handle connection events
    socket.on('connect', () => {
        console.log('Connected to server');
        updateStatus('waiting', 'Menghubungkan ke server...');
        
        // Send phone number to server
        socket.emit('register-phone', { phone: phoneNumber });
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateStatus('disconnected', 'Terputus dari server');
    });
    
    // Handle QR code generation
    socket.on('qr', (qrCode) => {
        console.log('QR code received from server');
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
        console.log('Generating QR code display');
        qrcodeElement.innerHTML = '';
        
        try {
            QRCode.toCanvas(qrcodeElement, text, {
                width: 200,
                height: 200,
                color: {
                    dark: "#000000",
                    light: "#ffffff"
                }
            }, function(error) {
                if (error) {
                    console.error('Error generating QR code:', error);
                    // Fallback: show error message
                    qrcodeElement.innerHTML = `
                        <div style="text-align: center; color: red; padding: 20px;">
                            <p>Error generating QR code</p>
                            <p>Silakan refresh halaman</p>
                        </div>
                    `;
                } else {
                    console.log('QR code generated successfully');
                }
            });
        } catch (error) {
            console.error('Error in QR code generation:', error);
            qrcodeElement.innerHTML = `
                <div style="text-align: center; color: red; padding: 20px;">
                    <p>Error generating QR code</p>
                    <p>Silakan refresh halaman</p>
                </div>
            `;
        }
    }
    
    // Update status display
    function updateStatus(status, message) {
        console.log('Updating status:', status, message);
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
        } else if (status === 'error') {
            statusElement.className = 'status disconnected';
            icon.className = 'fas fa-exclamation-circle';
        } else {
            statusElement.className = 'status';
            icon.className = 'fas fa-sync-alt fa-spin';
        }
        
        statusElement.appendChild(icon);
        statusElement.appendChild(text);
    }
    
    // Event listeners untuk tombol
    refreshBtn.addEventListener('click', function() {
        console.log('Refresh button clicked');
        updateStatus('waiting', 'Memperbarui QR code...');
        socket.emit('refresh-qr');
    });
    
    backBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Initial status
    updateStatus('waiting', 'Memulai proses pairing...');
});
