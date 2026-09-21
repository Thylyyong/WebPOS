<script setup lang="ts">
import { RouterView } from 'vue-router';
import ToastContainer from './components/common/ToastContainer.vue';
</script>

<template>
  <div class="min-h-screen bg-[#090D16] text-[#F8FAFC]">
    <RouterView />
    <ToastContainer />
  </div>
</template>
