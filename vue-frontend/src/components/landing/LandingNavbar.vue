<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { RouterLink } from 'vue-router';
import { LayoutGrid, Menu, X } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();
const open = ref(false);
const scrolled = ref(false);

const links = [
  { label: 'Home', id: 'home' },
  { label: 'Features', id: 'features' },
  { label: 'Showcase', id: 'showcase' },
  { label: 'About', id: 'about' },
  { label: 'Contact', id: 'contact' }
];

function goTo(id: string) {
  open.value = false;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <header
    class="fixed top-0 inset-x-0 z-50 transition-all duration-200"
    :class="scrolled || open ? 'bg-white/90 backdrop-blur border-b border-slate-200' : 'bg-transparent'"
  >
    <nav class="max-w-6xl mx-auto h-16 px-5 flex items-center justify-between">
      <a href="#home" class="flex items-center gap-2.5" @click.prevent="goTo('home')">
        <span class="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
          <LayoutGrid class="w-5 h-5" />
        </span>
        <span class="text-[17px] font-extrabold tracking-tight text-slate-900">OmniPOS</span>
      </a>

      <ul class="hidden md:flex items-center gap-8">
        <li v-for="l in links" :key="l.id">
          <a
            :href="`#${l.id}`"
            class="text-[14px] font-medium text-slate-600 hover:text-teal-700 transition-colors"
            @click.prevent="goTo(l.id)"
          >{{ l.label }}</a>
        </li>
      </ul>

      <div class="flex items-center gap-2">
        <RouterLink
          to="/login"
          class="h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[14px] font-semibold inline-flex items-center transition-colors"
        >{{ authStore.isAuthenticated ? 'Open POS' : 'Login' }}</RouterLink>
        <button
          type="button"
          class="md:hidden w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center"
          :aria-label="open ? 'Close menu' : 'Open menu'"
          :aria-expanded="open"
          @click="open = !open"
        >
          <X v-if="open" class="w-5 h-5" />
          <Menu v-else class="w-5 h-5" />
        </button>
      </div>
    </nav>

    <div v-if="open" class="md:hidden border-t border-slate-200 bg-white px-5 py-3">
      <a
        v-for="l in links"
        :key="l.id"
        :href="`#${l.id}`"
        class="block py-2.5 text-[15px] font-medium text-slate-700"
        @click.prevent="goTo(l.id)"
      >{{ l.label }}</a>
    </div>
  </header>
</template>
