import { supabase } from './supabase.js';
import { initChatbot } from './chatbot.js';

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const loginErrorEl = document.getElementById('login-error');
    const registerErrorEl = document.getElementById('register-error');

    const loginBtnText = document.getElementById('login-btn-text');
    const registerBtnText = document.getElementById('register-btn-text');

    const toggleForms = (showRegister) => {
        if (showRegister) {
            // Add exit animation to login form
            loginFormContainer.classList.add('form-container-exit');
            setTimeout(() => {
                loginFormContainer.classList.add('hidden');
                loginFormContainer.classList.remove('form-container-exit');
                registerFormContainer.classList.remove('hidden');
                registerFormContainer.classList.add('form-container-enter');
            }, 300);
        } else {
            // Add exit animation to register form
            registerFormContainer.classList.add('form-container-exit');
            setTimeout(() => {
                registerFormContainer.classList.add('hidden');
                registerFormContainer.classList.remove('form-container-exit');
                loginFormContainer.classList.remove('hidden');
                loginFormContainer.classList.add('form-container-enter');
            }, 300);
        }
    };
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'register') {
        toggleForms(true);
    }

    showRegisterBtn.addEventListener('click', () => toggleForms(true));
    showLoginBtn.addEventListener('click', () => toggleForms(false));

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorEl.classList.add('hidden');
        const formData = new FormData(loginForm);
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        // Add loading spinner and text
        loginBtnText.innerHTML = '<span class="loading-spinner"></span> Signing In...';

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.get('username'), // assuming username is email
                password: formData.get('password')
            });
            if (error) throw error;
            // Supabase handles session automatically, no need to store token manually
            window.location.href = 'dashboard.html';
        } catch (error) {
            loginErrorEl.textContent = error.message || 'Login failed. Please check your credentials.';
            loginErrorEl.classList.remove('hidden');
            submitButton.disabled = false;
            loginBtnText.textContent = 'Sign In';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerErrorEl.classList.add('hidden');
        const formData = new FormData(registerForm);
        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        // Add loading spinner and text
        registerBtnText.innerHTML = '<span class="loading-spinner"></span> Creating Account...';

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.get('email'),
                password: formData.get('password'),
                options: {
                    data: {
                        username: formData.get('username')
                    }
                }
            });
            if (error) throw error;

            // Store additional user data in users table
            try {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: data.user.id,
                        username: formData.get('username'),
                        email: formData.get('email')
                    });
                if (insertError) throw insertError;
                console.log('User data stored successfully');
            } catch (insertError) {
                console.error('Failed to store user data:', insertError);
                // Optionally, delete the auth user if insert fails, but for now just log
            }

            toggleForms(false);
            const successMsg = document.createElement('p');
            successMsg.className = 'text-green-600 text-sm mb-4 text-center message-enter';
            successMsg.textContent = 'Registration successful! You can now sign in.';
            loginFormContainer.insertBefore(successMsg, loginForm);
        } catch (error) {
            registerErrorEl.textContent = error.message || 'Registration failed. Please try again.';
            registerErrorEl.classList.remove('hidden');
        } finally {
            submitButton.disabled = false;
            registerBtnText.textContent = 'Create Account';
        }
    });

    const chatbotContainer = document.getElementById('chatbot-container');
    if (chatbotContainer) {
        (async () => {
            await initChatbot(chatbotContainer);
        })();
    }
});
