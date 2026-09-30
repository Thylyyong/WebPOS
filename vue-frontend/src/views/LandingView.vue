<script setup lang="ts">
import LandingNavbar from '../components/landing/LandingNavbar.vue';
import LandingHero from '../components/landing/LandingHero.vue';
import FeaturesSection from '../components/landing/FeaturesSection.vue';
import ShowcaseVideo from '../components/landing/ShowcaseVideo.vue';
import AboutSection from '../components/landing/AboutSection.vue';
import CtaSection from '../components/landing/CtaSection.vue';
import LandingFooter from '../components/landing/LandingFooter.vue';
</script>

<template>
  <div class="min-h-screen bg-[#F5F7FA] text-slate-900 select-text">
    <LandingNavbar />
    <main>
      <LandingHero />
      <FeaturesSection />
      <ShowcaseVideo />
      <AboutSection />
      <CtaSection />
    </main>
    <LandingFooter />
  </div>
</template>
