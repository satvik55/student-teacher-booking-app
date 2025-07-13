// js/main.js

import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const messageBox = document.getElementById('message-box');

    // Switch to Register View
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    // Switch to Login View
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    // Login logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                showMessage('Login successful! Redirecting...', 'success');
                // Redirect based on user role
                redirectUser(user.uid);
            })
            .catch((error) => {
                showMessage(`Error: ${error.message}`, 'error');
            });
    });

    // Registration logic
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                // Now, save the user's role and name in Firestore
                return setDoc(doc(db, "users", user.uid), {
                    name: name,
                    email: email,
                    role: 'student',
                    approved: false // Students need admin approval
                });
            })
            .then(() => {
                showMessage('Registration successful! An admin will approve your account shortly.', 'success');
                registerForm.reset();
                // Switch back to login view
                registerContainer.classList.add('hidden');
                loginContainer.classList.remove('hidden');
            })
            .catch((error) => {
                showMessage(`Error: ${error.message}`, 'error');
            });
    });

    // Redirect user based on their role stored in Firestore
    async function redirectUser(uid) {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'admin') {
                window.location.href = 'admin.html';
            } else if (userData.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else if (userData.role === 'student') {
                if (userData.approved) {
                    window.location.href = 'student.html';
                } else {
                    showMessage('Your account is pending approval from an administrator.', 'error');
                    auth.signOut();
                }
            }
        } else {
             // This can happen if a user is created in Auth but not in Firestore
             // Or for special accounts like the admin you'll create manually
             // For now, let's check for a hardcoded admin email
             const user = auth.currentUser;
             if(user.email === 'admin@unifiedmentor.com') {
                 // Create admin doc if it doesn't exist
                 await setDoc(doc(db, "users", user.uid), {
                     name: 'Admin',
                     email: user.email,
                     role: 'admin'
                 });
                 window.location.href = 'admin.html';
             } else {
                showMessage('User data not found. Please contact support.', 'error');
                auth.signOut();
             }
        }
    }

    // Utility to show messages to the user
    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`; // 'success' or 'error'
        messageBox.classList.remove('hidden');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 4000);
    }
});
