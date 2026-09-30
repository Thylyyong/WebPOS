<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { LayoutGrid, Mail, Phone, MapPin } from 'lucide-vue-next';

const links = [
  { label: 'Home', id: 'home' },
  { label: 'Features', id: 'features' },
  { label: 'Showcase', id: 'showcase' },
  { label: 'About', id: 'about' }
];

function goTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <footer id="contact" class="bg-white border-t border-slate-200">
    <div class="max-w-6xl mx-auto px-5 py-12 grid md:grid-cols-3 gap-10">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
            <LayoutGrid class="w-5 h-5" />
          </span>
          <span class="text-[17px] font-extrabold tracking-tight text-slate-900"></span>
        </div>
        <p class="mt-4 text-[14px] leading-relaxed text-slate-500 max-w-xs">
          A modern point of sale for restaurants.
        </p>
      </div>

      <div>
        <p class="text-[12px] font-bold tracking-wider text-slate-400 uppercase">Navigate</p>
        <ul class="mt-4 space-y-2.5">
          <li v-for="l in links" :key="l.id">
            <a :href="`#${l.id}`" class="text-[14.5px] text-slate-600 hover:text-teal-700" @click.prevent="goTo(l.id)">{{ l.label }}</a>
          </li>
          <li><RouterLink to="/login" class="text-[14.5px] text-slate-600 hover:text-teal-700">Login</RouterLink></li>
        </ul>
      </div>

      <div>
        <p class="text-[12px] font-bold tracking-wider text-slate-400 uppercase">Contact</p>
        <ul class="mt-4 space-y-2.5 text-[14.5px] text-slate-600">
          <li class="flex items-center gap-2.5"><Mail class="w-4 h-4 text-teal-600" /> hello@EAT-N-DRINKPOS-restaurant.com</li>
          <li class="flex items-center gap-2.5"><Phone class="w-4 h-4 text-teal-600" /> +077 594 587</li>
          <li class="flex items-center gap-2.5"><MapPin class="w-4 h-4 text-teal-600" /> PHNOM PENH</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-slate-200 py-5 text-center text-[13px] text-slate-400">
      © {{ new Date().getFullYear() }}. All rights reserved.
    </div>
  </footer>
</template>
