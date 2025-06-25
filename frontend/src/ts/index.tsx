
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// DOM Elements
const loginView = document.getElementById('login-view')!;
const registerView = document.getElementById('register-view')!;
const profileView = document.getElementById('profile-view')!;
const adminView = document.getElementById('admin-view')!; // Added Admin View
const messageArea = document.getElementById('message-area')!;
const profileInfo = document.getElementById('profile-info')!;
const adminUserListContainer = document.getElementById('admin-user-list-container')!; // Added Admin User List

const navLoginButton = document.getElementById('nav-login')!;
const navRegisterButton = document.getElementById('nav-register')!;
const navProfileButton = document.getElementById('nav-profile')!;
const navAdminPanelButton = document.getElementById('nav-admin-panel')!; // Added Admin Nav Button
const logoutButton = document.getElementById('logout-button')!;

const loginForm = document.getElementById('login-form') as HTMLFormElement;
const registerForm = document.getElementById('register-form') as HTMLFormElement;

const API_BASE_URL = 'https://scp-ai.onrender.com/api'; // Corrected API URL

// --- State Management and UI Updates ---
function showView(viewName: 'login' | 'register' | 'profile' | 'admin') {
    loginView.style.display = 'none';
    registerView.style.display = 'none';
    profileView.style.display = 'none';
    adminView.style.display = 'none';

    navLoginButton.classList.remove('active');
    navRegisterButton.classList.remove('active');
    navProfileButton.classList.remove('active');
    navAdminPanelButton.classList.remove('active');


    if (viewName === 'login') {
        loginView.style.display = 'block';
        navLoginButton.classList.add('active');
    } else if (viewName === 'register') {
        registerView.style.display = 'block';
        navRegisterButton.classList.add('active');
    } else if (viewName === 'profile') {
        profileView.style.display = 'block';
        navProfileButton.classList.add('active');
    } else if (viewName === 'admin') {
        adminView.style.display = 'block';
        navAdminPanelButton.classList.add('active');
    }
}

function updateNavForUserRole(accessLevel?: string) {
    if (accessLevel === '05 Council') {
        navAdminPanelButton.style.display = 'inline-block';
    } else {
        navAdminPanelButton.style.display = 'none';
    }
}

function updateNavForLoggedInState(isLoggedIn: boolean) {
    if (isLoggedIn) {
        navLoginButton.style.display = 'none';
        navRegisterButton.style.display = 'none';
        navProfileButton.style.display = 'inline-block';
        logoutButton.style.display = 'inline-block';
        // Admin button visibility handled by updateNavForUserRole after profile fetch
    } else {
        navLoginButton.style.display = 'inline-block';
        navRegisterButton.style.display = 'inline-block';
        navProfileButton.style.display = 'none';
        logoutButton.style.display = 'none';
        updateNavForUserRole(undefined); // Hide admin button on logout
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
    console.log('handleRegistration called');
    event.preventDefault();
    const formData = new FormData(registerForm);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const accessLevel = formData.get('accessLevel') as string; // Will be empty if user doesn't type, backend defaults

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
    console.log('handleLogin called');
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
            updateNavForLoggedInState(true); // Update nav immediately
            await fetchProfile(); // Fetch profile which will also set admin nav and show profile view
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

    profileInfo.innerHTML = '<p>Loading profile...</p>'; 

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
        updateNavForUserRole(data.user.accessLevel); // Update admin nav button based on role
        showView('profile'); 
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        profileInfo.innerHTML = '<p>Could not load profile information.</p>';
        displayMessage(error instanceof Error ? error.message : 'Failed to fetch profile.', 'error');
        // If profile fetch fails critically (e.g. auth issue), logout
        if (error instanceof Error && (error.message.includes('Token expired') || error.message.includes('Invalid token'))) {
            handleLogout();
        }
    }
}

async function fetchAdminUsers() {
    console.log('Attempting to fetch admin users...');
    const token = localStorage.getItem('authToken');
    if (!token) {
        displayMessage('Authentication required for admin panel.', 'error');
        return;
    }
    adminUserListContainer.innerHTML = '<p>Loading users...</p>';
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Admin users fetch response status:', response.status);
        
        const data = await response.json(); // Always try to parse JSON for error messages

        if (!response.ok) {
            if (response.status === 403) throw new Error(data.message || 'Access Denied. Not an admin.');
            throw new Error(data.message || `Failed to fetch users: ${response.statusText}`);
        }

        if (data.users && data.users.length > 0) {
            let usersHtml = '<ul>';
            data.users.forEach((user: { _id: string; username: string; accessLevel: string; createdAt: string }) => {
                usersHtml += `<li>
                    <p><strong>Username:</strong> ${user.username}</p>
                    <p><strong>Access Level:</strong> ${user.accessLevel}</p>
                    <p><strong>ID:</strong> ${user._id}</p>
                    <p><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                </li>`;
            });
            usersHtml += '</ul>';
            adminUserListContainer.innerHTML = usersHtml;
        } else {
            adminUserListContainer.innerHTML = '<p>No users found.</p>';
        }
    } catch (error) {
        console.error('Failed to fetch admin users:', error);
        adminUserListContainer.innerHTML = `<p>Error loading users: ${error instanceof Error ? error.message : 'Unknown error'}</p>`;
        displayMessage(error instanceof Error ? error.message : 'Could not load admin user list.', 'error');
    }
}


function handleLogout() {
    localStorage.removeItem('authToken');
    profileInfo.innerHTML = ''; 
    updateNavForLoggedInState(false); // This will also hide admin button via updateNavForUserRole
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
            fetchProfile(); 
        } else {
            showView('login'); 
        }
    });
    navAdminPanelButton.addEventListener('click', () => { 
        showView('admin'); 
        fetchAdminUsers(); 
    });

    // Initial state setup
    if (localStorage.getItem('authToken')) {
        updateNavForLoggedInState(true); // Show correct nav buttons first
        fetchProfile(); // Then fetch profile, which will also update admin button visibility and show profile view
    } else {
        updateNavForLoggedInState(false);
        showView('login'); 
    }
});
