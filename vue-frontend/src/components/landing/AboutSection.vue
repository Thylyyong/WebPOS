<script setup lang="ts">
import { UtensilsCrossed, ShieldCheck, Clock } from 'lucide-vue-next';

const items = [
  { icon: UtensilsCrossed, title: 'Built for restaurants', text: 'Menu categories, tables, and dine-in or takeaway orders are part of the everyday workflow.' },
  { icon: Clock, title: 'Faster service', text: 'Staff pick items, send the order, and take payment from one screen.' },
  { icon: ShieldCheck, title: 'Role-based access', text: 'Cashiers focus on service, while owners get access to catalog, sales, accounting, and settings.' }
];
</script>

<template>
  <section id="about" class="py-16 md:py-24 bg-white border-t border-slate-200">
    <div class="max-w-6xl mx-auto px-5 grid lg:grid-cols-2 gap-12 items-start">
      <div>
        <p class="text-[13px] font-bold tracking-wider text-teal-600 uppercase">About</p>
        <h2 class="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">One system for daily operations</h2>
        <p class="mt-5 text-[16px] leading-relaxed text-slate-600">
          OmniPOS brings ordering, tables, cash handling, and reporting together so restaurant
          staff spend less time switching between tools and more time serving guests.
        </p>
      </div>

      <ul class="space-y-4">
        <li v-for="i in items" :key="i.title" class="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span class="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-200 text-teal-600 flex items-center justify-center">
            <component :is="i.icon" class="w-5 h-5" />
          </span>
          <div>
            <h3 class="text-[16px] font-bold text-slate-900">{{ i.title }}</h3>
            <p class="mt-1 text-[14.5px] leading-relaxed text-slate-600">{{ i.text }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
