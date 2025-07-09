и<template>
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

                        <div class="flex items-center">
                            <label class="flex items-center">
                                <input type="checkbox"
                                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                        </div>

                        <button type="submit"
                            class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Sign In
                        </button>
                    </form>
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