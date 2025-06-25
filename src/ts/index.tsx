/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// DOM Elements
const loginView = document.getElementById('login-view')!;
const registerView = document.getElementById('register-view')!;
const profileView = document.getElementById('profile-view')!;
const messageArea = document.getElementById('message-area')!;
const profileInfo = document.getElementById('profile-info')!;

const navLoginButton = document.getElementById('nav-login')!;
const navRegisterButton = document.getElementById('nav-register')!;
const navProfileButton = document.getElementById('nav-profile')!;
const logoutButton = document.getElementById('logout-button')!;

const loginForm = document.getElementById('login-form') as HTMLFormElement;
const registerForm = document.getElementById('register-form') as HTMLFormElement;

const API_BASE_URL = '/api'; // Assuming backend is served from the same origin

// --- State Management and UI Updates ---
function showView(viewName: 'login' | 'register' | 'profile') {
    loginView.style.display = 'none';
    registerView.style.display = 'none';
    profileView.style.display = 'none';

    navLoginButton.classList.remove('active');
    navRegisterButton.classList.remove('active');
    navProfileButton.classList.remove('active');

    if (viewName === 'login') {
        loginView.style.display = 'block';
        navLoginButton.classList.add('active');
    } else if (viewName === 'register') {
        registerView.style.display = 'block';
        navRegisterButton.classList.add('active');
    } else if (viewName === 'profile') {
        profileView.style.display = 'block';
        navProfileButton.classList.add('active');
    }
}

function updateNavForLoggedInState(isLoggedIn: boolean) {
    if (isLoggedIn) {
        navLoginButton.style.display = 'none';
        navRegisterButton.style.display = 'none';
        navProfileButton.style.display = 'inline-block';
        logoutButton.style.display = 'inline-block';
    } else {
        navLoginButton.style.display = 'inline-block';
        navRegisterButton.style.display = 'inline-block';
        navProfileButton.style.display = 'none';
        logoutButton.style.display = 'none';
    }
}

function displayMessage(message: string, type: 'success' | 'error') {
    messageArea.textContent = message;
    messageArea.className = type === 'success' ? 'message-success' : 'message-error';
    // Clear message after some time
    setTimeout(() => {
        messageArea.textContent = '';
        messageArea.className = '';
    }, 5000);
}

// --- API Interaction ---
async function handleRegistration(event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const accessLevel = formData.get('accessLevel') as string;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, accessLevel }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        displayMessage('Registration successful! Please log in.', 'success');
        registerForm.reset();
        showView('login');
    } catch (error) {
        console.error('Registration failed:', error);
        displayMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.', 'error');
    }
}

async function handleLogin(event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            displayMessage('Login successful!', 'success');
            loginForm.reset();
            await fetchProfile();
            updateNavForLoggedInState(true);
            showView('profile');
        } else {
            throw new Error('Login failed: No token received.');
        }
    } catch (error) {
        console.error('Login failed:', error);
        displayMessage(error instanceof Error ? error.message : 'Login failed. Check credentials.', 'error');
    }
}

async function fetchProfile() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        displayMessage('Not authenticated. Please log in.', 'error');
        handleLogout(); // Ensure logged out state if no token
        return;
    }

    profileInfo.innerHTML = '<p>Loading profile...</p>'; // Reset profile info

    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 // Token might be expired or invalid
                displayMessage('Session expired or invalid. Please log in again.', 'error');
                handleLogout();
                return;
            }
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        profileInfo.innerHTML = `
            <p><strong>Username:</strong> ${data.user.username}</p>
            <p><strong>Access Level:</strong> ${data.user.accessLevel}</p>
            <p><strong>User ID:</strong> ${data.user._id}</p>
        `;
        updateNavForLoggedInState(true);
        showView('profile'); // Ensure profile view is shown
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        profileInfo.innerHTML = '<p>Could not load profile information.</p>';
        displayMessage(error instanceof Error ? error.message : 'Failed to fetch profile.', 'error');
        // If profile fetch fails critically (e.g. auth issue), consider logging out
        // For now, just display error
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    profileInfo.innerHTML = ''; // Clear profile info
    updateNavForLoggedInState(false);
    showView('login');
    displayMessage('Logged out successfully.', 'success');
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    registerForm.addEventListener('submit', handleRegistration);
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);

    navLoginButton.addEventListener('click', () => showView('login'));
    navRegisterButton.addEventListener('click', () => showView('register'));
    navProfileButton.addEventListener('click', () => {
        if (localStorage.getItem('authToken')) {
            fetchProfile(); // Re-fetch profile in case it needs update or wasn't loaded
        } else {
            showView('login'); // Should not happen if button is visible, but good fallback
        }
    });

    // Initial state setup
    if (localStorage.getItem('authToken')) {
        fetchProfile(); // This will also handle UI updates for logged-in state
    } else {
        updateNavForLoggedInState(false);
        showView('login'); // Default to login view if not authenticated
    }
});