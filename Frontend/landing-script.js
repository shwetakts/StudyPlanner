// Google Sign-In Callback
function handleCredentialResponse(response) {
    console.log("Sign-in successful!");
    
    // Decode the JWT token to get user info
    const credential = response.credential;
    const payload = credential.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    
    const userEmail = decodedPayload.email;
    const userName = decodedPayload.name;
    const userPicture = decodedPayload.picture;
    
    // Store user info
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('userName', userName);
    localStorage.setItem('userPicture', userPicture);
    
    console.log(`Signed in as: ${userName} (${userEmail})`);
    
    // Show success message
    showMessage(`Welcome ${userName}! Redirecting to dashboard...`, 'success');
    
    // Redirect to main app after a short delay
    setTimeout(() => {
        window.location.href = 'main.html';
    }, 1000);
}

// Initialize Google Sign-In
window.onload = function () {
    console.log('Page loaded, initializing Google Sign-In...');
    
    // REPLACE WITH YOUR ACTUAL CLIENT ID
    const CLIENT_ID = '486074732333-m7aomk3pucrb9bchnq37le3ejfcg7ofn.apps.googleusercontent.com';
    
    if (typeof google !== 'undefined') {
        console.log('Google API loaded successfully');
        
        google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        
        // Render the sign-in button
        google.accounts.id.renderButton(
            document.getElementById('signInButton'),
            {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: 300
            }
        );
        
        console.log('Google Sign-In button rendered');
        
        // Check if user is already signed in
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            console.log(`Already signed in as: ${userEmail}`);
            const signInBtn = document.getElementById('signInButton');
            const signOutBtn = document.getElementById('signOutButton');
            
            if (signInBtn) signInBtn.style.display = 'none';
            if (signOutBtn) signOutBtn.style.display = 'block';
            
            showMessage(`Welcome back! Redirecting to dashboard...`, 'info');
            
            // Auto-redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 2000);
        }
    } else {
        console.error("Google Sign-In script not loaded.");
        showMessage("Google Sign-In failed to load. Please refresh the page.", 'error');
    }
};

// Sign Out Functionality
const signOutBtn = document.getElementById('signOutButton');
if (signOutBtn) {
    signOutBtn.onclick = () => {
        console.log("Signing out...");
        
        // Clear localStorage
        localStorage.clear();
        
        // Disable Google auto-select
        if (typeof google !== 'undefined') {
            google.accounts.id.disableAutoSelect();
        }
        
        showMessage("Signed out successfully!", 'success');
        
        // Show sign-in button, hide sign-out button
        const signInBtn = document.getElementById('signInButton');
        if (signInBtn) signInBtn.style.display = 'block';
        if (signOutBtn) signOutBtn.style.display = 'none';
        
        // Redirect to home page (optional - can stay on page)
        // window.location.href = '/';
    };
}

// Helper function to show messages
function showMessage(message, type) {
    const msgDiv = document.getElementById('statusMessage');
    if (!msgDiv) return;
    
    msgDiv.textContent = message;
    msgDiv.className = `status-message ${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (msgDiv) {
            msgDiv.textContent = '';
            msgDiv.className = 'status-message';
        }
    }, 3000);
}