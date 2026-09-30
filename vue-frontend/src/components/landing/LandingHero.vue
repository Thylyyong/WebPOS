<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ArrowRight, Play, CircleCheck } from 'lucide-vue-next';

function goTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const points = ['Dine-in & takeaway checkout', 'Live table floor plan', 'Shift & cash drawer control'];
</script>

<template>
  <section id="home" class="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
    <div class="absolute inset-x-0 top-0 h-[560px] bg-gradient-to-b from-teal-50 to-transparent -z-10"></div>

    <div class="max-w-6xl mx-auto px-5 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-teal-200 text-teal-700 text-[12px] font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          Restaurant POS System
        </span>
        <h1 class="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.05] text-slate-900">
          Manage your restaurant <span class="text-teal-600">smarter.</span>
        </h1>
        <p class="mt-5 text-[17px] leading-relaxed text-slate-600 max-w-lg">
          A modern POS designed to make restaurant operations easier, faster, and more organized —
          from the first order to the end-of-day cash count.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink
            to="/login"
            class="h-12 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[15px] font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            Login to KIRI POS <ArrowRight class="w-4 h-4" />
          </RouterLink>
          <button
            type="button"
            class="h-12 px-6 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-[15px] font-semibold inline-flex items-center gap-2 transition-colors"
            @click="goTo('showcase')"
          >
            <Play class="w-4 h-4 text-teal-600" /> Watch the demo
          </button>
        </div>

        <ul class="mt-8 space-y-2.5">
          <li v-for="p in points" :key="p" class="flex items-center gap-2.5 text-[14.5px] text-slate-600">
            <CircleCheck class="w-[18px] h-[18px] text-teal-600 shrink-0" /> {{ p }}
          </li>
        </ul>
      </div>

      <!-- Product visual: real screenshots of the app -->
      <div class="relative">
        <div class="rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 overflow-hidden">
          <div class="h-8 px-3 flex items-center gap-1.5 border-b border-slate-100 bg-slate-50">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
          </div>
          <img
            src="/images/screen-pos.jpg"
            alt="KIRI POS terminal showing the menu grid and current order"
            class="w-full block"
            width="1400"
            height="797"
            fetchpriority="high"
          />
        </div>
        <div class="hidden sm:block absolute -bottom-8 -left-8 w-[52%] rounded-xl bg-white border border-slate-200 shadow-lg shadow-slate-900/10 overflow-hidden">
          <img
            src="/images/screen-tables.jpg"
            alt="KIRI POS floor plan with available and occupied tables"
            class="w-full block"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </section>
</template>
