<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-5 sm:p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div class="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3">
                <div class="h-4 bg-gray-200 rounded w-4 animate-pulse"></div>
              </th>
              <th class="px-6 py-3">
                <div class="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </th>
              <th class="px-6 py-3">
                <div class="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </th>
              <th class="px-6 py-3">
                <div class="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              </th>
              <th class="px-6 py-3">
                <div class="h-4 bg-gray-200 rounded w-14 animate-pulse"></div>
              </th>
              <th class="px-6 py-3">
                <div class="h-4 bg-gray-200 rounded w-18 animate-pulse"></div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="n in itemCount" :key="n" class="animate-pulse">
              <td class="px-6 py-4">
                <div class="h-4 bg-gray-200 rounded w-4"></div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-start space-x-3">
                  <div class="h-12 w-12 bg-gray-200 rounded-lg"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-3 bg-gray-200 rounded w-full"></div>
                    <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                  <div class="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="h-4 bg-gray-200 rounded w-24"></div>
              </td>
              <td class="px-6 py-4">
                <div class="h-6 bg-gray-200 rounded-full w-20"></div>
              </td>
              <td class="px-6 py-4">
                <div class="flex space-x-2">
                  <div class="h-4 bg-gray-200 rounded w-16"></div>
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                  <div class="h-4 bg-gray-200 rounded w-14"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  itemCount: {
    type: Number,
    default: 10
  }
});
</script> 