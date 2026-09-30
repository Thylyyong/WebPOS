<script setup lang="ts">
import { ref } from 'vue';
import { Play } from 'lucide-vue-next';

const videoSrc = '/videos/webpos-demo.mp4';
const poster = '/videos/webpos-demo-poster.jpg';

const videoEl = ref<HTMLVideoElement | null>(null);
const started = ref(false);
const failed = ref(false);

async function play() {
  started.value = true;
  try {
    await videoEl.value?.play();
  } catch {
    // Controls are shown once started, so the visitor can press play manually.
  }
}

const shown = [
  'Cashier sign-in',
  'Menu browsing by category',
  'Adding items to the order',
  'Cash payment',
  'Table floor plan',
  'Order history',
  'Closing the register'
];
</script>

<template>
  <section id="showcase" class="py-16 md:py-24 bg-white border-y border-slate-200">
    <div class="max-w-6xl mx-auto px-5">
      <div class="max-w-2xl">
        <p class="text-[13px] font-bold tracking-wider text-teal-600 uppercase">System Showcase</p>
        <h2 class="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">See it in action</h2>
      </div>

      <div class="mt-10 grid lg:grid-cols-3 gap-8 items-start">
        <div class="lg:col-span-2">
          <div class="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xl shadow-slate-900/10">
            <video
              v-show="!failed"
              ref="videoEl"
              class="absolute inset-0 w-full h-full object-cover"
              :poster="poster"
              :controls="started"
              preload="metadata"
              playsinline
              @error="failed = true"
            >
              <source :src="videoSrc" type="video/mp4" />
            </video>

            <!-- Fallback if the file is missing -->
            <div v-if="failed" class="absolute inset-0 flex items-center justify-center text-center p-6 text-slate-300 text-[14px]">
              Demo video is not available yet. Add it at <code class="mx-1 text-teal-300">public/videos/webpos-demo.mp4</code>.
            </div>

            <button
              v-if="!started && !failed"
              type="button"
              class="absolute inset-0 flex items-center justify-center bg-slate-900/25 hover:bg-slate-900/35 transition-colors group"
              aria-label="Play system demo video"
              @click="play"
            >
              <span class="w-20 h-20 rounded-full bg-white text-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Play class="w-8 h-8 ml-1" fill="currentColor" />
              </span>
            </button>
          </div>
        </div>

        <div>
          <h3 class="text-xl font-bold text-slate-900">Explore the KIRI POS system</h3>
          <p class="mt-3 text-[15px] leading-relaxed text-slate-600">
            Take a quick look at how the system helps restaurant staff take orders, manage tables,
            and keep daily operations in one place.
          </p>
          <p class="mt-6 text-[12px] font-bold tracking-wider text-slate-400 uppercase">In this demo</p>
          <ul class="mt-3 flex flex-wrap gap-2">
            <li
              v-for="s in shown"
              :key="s"
              class="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[13px] font-medium text-slate-700"
            >{{ s }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
