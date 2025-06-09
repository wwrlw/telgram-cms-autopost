<template>
  <div class="p-6 max-w-xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">🦙 Чат с LLaMA 3</h1>

    <div class="h-[400px] overflow-y-auto border rounded-xl p-4 mb-4 bg-white" ref="chatWindow">
      <ChatMessage
        v-for="(msg, index) in messages"
        :key="index"
        :message="msg.text"
        :isUser="msg.isUser"
      />
    </div>

    <form @submit.prevent="sendMessage" class="flex gap-2">
      <input
        v-model="input"
        type="text"
        class="flex-1 border rounded px-4 py-2"
        placeholder="Напиши что-нибудь..."
      />
      <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Отправить</button>
    </form>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import axios from 'axios'
import ChatMessage from './components/ChatMessage.vue'

const input = ref('')
const messages = ref([])
const chatWindow = ref(null)

const sendMessage = async () => {
  if (!input.value.trim()) return

  const userMsg = input.value
  messages.value.push({ text: userMsg, isUser: true })
  input.value = ''

  await nextTick()
  chatWindow.value.scrollTop = chatWindow.value.scrollHeight

  try {
    const res = await axios.post('http://localhost:3000/chat', {
      prompt: userMsg
    })

    messages.value.push({ text: res.data.response, isUser: false })
  } catch (err) {
    messages.value.push({ text: '⚠️ Ошибка: ' + err.message, isUser: false })
  }

  await nextTick()
  chatWindow.value.scrollTop = chatWindow.value.scrollHeight
}
</script>

<style>
body {
  font-family: sans-serif;
  background: #f9fafb;
}
</style>
