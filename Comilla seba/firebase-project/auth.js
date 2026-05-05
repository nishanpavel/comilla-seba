// Authentication Functions
class AuthManager {
    constructor() {
        this.auth = firebase.auth();
        this.currentUser = null;
        this.initAuthListener();
    }

    // Listen to auth state changes
    initAuthListener() {
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                console.log('User is signed in:', user.uid);
                this.updateUIForLoggedInUser(user);
            } else {
                console.log('User is signed out');
                this.updateUIForLoggedOutUser();
            }
        });
    }

    // Email/Password Registration
    async registerWithEmail(email, password, name, phone, role = 'customer') {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update user profile
            await user.updateProfile({
                displayName: name
            });

            // Save user data to Firestore
            const userData = {
                uid: user.uid,
                email: email,
                name: name,
                phone: phone,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('pavel00').doc('users').collection('data').doc(user.uid).set(userData);

            console.log('User registered successfully:', user);
            return { success: true, user: user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Email/Password Login
    async loginWithEmail(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('User logged in successfully:', userCredential.user);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Phone Number Authentication
    async sendPhoneVerification(phoneNumber) {
        try {
            const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
            const confirmationResult = await this.auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
            window.confirmationResult = confirmationResult;
            console.log('OTP sent to phone number');
            return { success: true };
        } catch (error) {
            console.error('Phone verification error:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyOTP(otp) {
        try {
            const result = await window.confirmationResult.confirm(otp);
            console.log('Phone number verified successfully:', result.user);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('OTP verification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            await this.auth.signOut();
            console.log('User logged out successfully');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get user role from Firestore
    async getUserRole(uid) {
        try {
            const doc = await db.collection('pavel00').doc('users').collection('data').doc(uid).get();
            if (doc.exists) {
                return doc.data().role;
            }
            return null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    }

    // Update UI for logged in user
    updateUIForLoggedInUser(user) {
        // Update navigation, show user info, etc.
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const userInfo = document.getElementById('user-info');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'block';
            userInfo.textContent = user.displayName || user.email;
        }
        if (logoutBtn) logoutBtn.style.display = 'block';
    }

    // Update UI for logged out user
    updateUIForLoggedOutUser() {
        // Reset UI to logged out state
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const userInfo = document.getElementById('user-info');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();