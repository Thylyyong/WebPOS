<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ArrowRight } from 'lucide-vue-next';
</script>

<template>
  <section class="py-16 md:py-24">
    <div class="max-w-6xl mx-auto px-5">
      <div class="rounded-3xl bg-teal-600 px-6 py-14 md:py-16 text-center">
        <h2 class="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Ready to manage your restaurant more easily?
        </h2>
        <p class="mt-3 text-[16px] text-teal-50/90">Sign in and start taking orders in seconds.</p>
        <RouterLink
          to="/login"
          class="mt-8 h-12 px-7 rounded-xl bg-white hover:bg-teal-50 text-teal-700 text-[15px] font-bold inline-flex items-center gap-2 transition-colors"
        >
          Login to WebPOS <ArrowRight class="w-4 h-4" />
        </RouterLink>
      </div>
    </div>
  </section>
</template>
