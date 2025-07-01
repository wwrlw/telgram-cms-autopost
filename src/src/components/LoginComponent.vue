<template>
    <div>
        <div class="gradient-bg flex items-center justify-center min-h-screen p-4">
            <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100" id="auth-container">

                <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {{ errorMessage }}
                </div>

                <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div class="bg-white p-4 rounded-lg">
                        Loading...
                    </div>
                </div>

                <div id="signin-form-container">
                    <div class="text-center mb-8">
                        <div
                            class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">Sign In to Your Account</h2>
                        <p class="text-gray-600 text-sm">Access your account to continue</p>
                    </div>

                    <form id="login-form" class="space-y-5" @submit.prevent="LoginService">
                        <div>
                            <label for="login-email"
                                class="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                            <input type="username" id="login-email" v-model="loginForm.username"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="your username">
                        </div>

                        <div>
                            <label for="login-password"
                                class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <input type="password" id="login-password" v-model="loginForm.password"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="••••••••">
                        </div>

                        <div class="flex items-center justify-between">
                            <label class="flex items-center">
                                <input type="checkbox"
                                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                            <a href="#" data-container="forgot-password-form-container" id="forgot-password-link"
                                class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                Forgot password?
                            </a>
                        </div>

                        <button type="submit"
                            class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Sign In
                        </button>
                    </form>

                    <div class="relative flex items-center my-6">
                        <div class="flex-grow border-t border-gray-300"></div>
                        <span class="flex-shrink mx-4 text-gray-500 text-sm">or continue with</span>
                        <div class="flex-grow border-t border-gray-300"></div>
                    </div>


                    <p class="text-center text-gray-600 text-sm mt-8">
                        Don't have an account?
                        <a href="#" data-container="signup-form-container" id="signup-link-login"
                            class="text-blue-600 hover:text-blue-800 font-semibold">
                            Sign Up
                        </a>
                    </p>
                </div>

                <div id="signup-form-container" class="hidden">
                    <div class="text-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">Create Account</h2>
                        <p class="text-gray-600 text-sm">Fill in your details to register</p>
                    </div>

                    <form id="signup-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="signup-first-name"
                                    class="block text-sm font-semibold text-gray-700 mb-1">First
                                    Name</label>
                                <input type="text" id="signup-first-name"
                                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    placeholder="First Name" required>
                            </div>
                            <div>
                                <label for="signup-last-name"
                                    class="block text-sm font-semibold text-gray-700 mb-1">Last
                                    Name</label>
                                <input type="text" id="signup-last-name"
                                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    placeholder="Last Name" required>
                            </div>
                        </div>

                        <div>
                            <label for="signup-email"
                                class="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                            <input type="email" id="signup-email"
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                placeholder="your@email.com" required>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="signup-phone"
                                    class="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                                <input type="tel" id="signup-phone"
                                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    placeholder="(11) 99999-9999">
                            </div>
                            <div>
                                <label for="signup-birthdate"
                                    class="block text-sm font-semibold text-gray-700 mb-1">Birthdate</label>
                                <input type="date" id="signup-birthdate"
                                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="signup-password"
                                    class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                                <input type="password" id="signup-password"
                                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    placeholder="••••••••" minlength="6" required>
                            </div>
                            <div>
                                <label for="signup-confirm-password"
                                    class="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                                <input type="password" id="signup-confirm-password"
                                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    placeholder="••••••••" required>
                            </div>
                        </div>

                        <button type="submit"
                            class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-6">
                            Create Account
                        </button>
                    </form>

                    <div class="relative flex items-center my-6">
                        <div class="flex-grow border-t border-gray-300"></div>
                        <span class="flex-shrink mx-4 text-gray-500 text-sm">or continue with</span>
                        <div class="flex-grow border-t border-gray-300"></div>
                    </div>

                    <div class="space-y-3">
                        <button
                            class="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">
                            <img src="https://img.icons8.com/color/20/000000/google-logo.png" alt="Google" class="mr-3">
                            <span class="text-gray-700 font-medium">Google</span>
                        </button>
                        <button
                            class="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">
                            <img src="https://img.icons8.com/color/20/000000/facebook-new.png" alt="Facebook"
                                class="mr-3">
                            <span class="text-gray-700 font-medium">Facebook</span>
                        </button>
                    </div>

                    <p class="text-center text-gray-600 text-sm mt-6">
                        Already have an account?
                        <a href="#" id="login-link-signup" data-container="signin-form-container"
                            class="text-blue-600 hover:text-blue-800 font-semibold">
                            Log In
                        </a>
                    </p>
                </div>

                <div id="forgot-password-form-container" class="hidden">
                    <div class="text-center mb-6">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">Recover Password</h2>
                        <p class="text-gray-600 text-sm">
                            Enter your email to receive the recovery link
                        </p>
                    </div>

                    <form id="forgot-password-form" class="space-y-5">
                        <div>
                            <label for="forgot-email"
                                class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input type="email" id="forgot-email"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="your@email.com" required>
                        </div>

                        <button type="submit"
                            class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Send Link
                        </button>
                    </form>

                    <div class="text-center mt-6">
                        <a href="#" data-container="signin-form-container" id="back-to-login-link-forgot"
                            class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm">
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                    clip-rule="evenodd" />
                            </svg>
                            Back to login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import http from '@/js/http';

const router = useRouter();
const errorMessage = ref('');
const loading = ref(false);

const loginForm = ref({
    username: '',
    password: ''
});

const signupForm = ref({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    birthdate: '',
    password: '',
    confirmPassword: ''
});

const forgotForm = ref({
    email: ''
});

const LoginService = async () => {
    errorMessage.value = '';
    loading.value = true;

    try {
        await http.login(loginForm.value, (res) => {
            loading.value = false;
            console.log('Login response:', res);

            if (res && res.success) {
                console.log('Token:', res.data.token);
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                router.push('/');
            } else {
                errorMessage.value = res?.message || 'Invalid credentials.';
            }
        });
    } catch (err) {
        loading.value = false;
        errorMessage.value = 'An error occurred. Please try again later.';
        console.error('Login error:', err);
    }
};
</script>