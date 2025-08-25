document.addEventListener('DOMContentLoaded', function() {
    const phoneForm = document.getElementById('phoneForm');
    const phoneInput = document.getElementById('phoneNumber');
    
    // Load saved phone number if exists
    const savedPhone = localStorage.getItem('whatsapp-bot-phone');
    if (savedPhone) {
        phoneInput.value = savedPhone;
    }
    
    phoneForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const phoneNumber = phoneInput.value.trim();
        
        // Validate phone number
        if (!phoneNumber || !/^[0-9]{8,15}$/.test(phoneNumber)) {
            alert('Masukkan nomor yang valid (8-15 digit angka tanpa kode negara)');
            return;
        }
        
        // Save phone number to localStorage
        localStorage.setItem('whatsapp-bot-phone', phoneNumber);
        
        // Redirect to pairing page with phone number as parameter
        window.location.href = `pairing.html?phone=${encodeURIComponent(phoneNumber)}`;
    });
    
    // Add real-time validation
    phoneInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
});
