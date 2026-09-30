<script setup lang="ts">
import { ShoppingCart, LayoutGrid, Package, Wallet, ChartColumn, Receipt } from 'lucide-vue-next';

const features = [
  { icon: ShoppingCart, title: 'Order Management', text: 'Take dine-in and takeaway orders, hold tickets, apply discounts, and split the bill at checkout.' },
  { icon: LayoutGrid, title: 'Table Management', text: 'See available and occupied tables at a glance, open tables, assign guests, and transfer orders.' },
  { icon: Package, title: 'Product & Menu Management', text: 'Organize your menu into categories and keep products and SKUs up to date.' },
  { icon: Wallet, title: 'Cash Register', text: 'Open and close shifts, record cash movements, and reconcile the drawer with a Z-report.' },
  { icon: ChartColumn, title: 'Sales & Reports', text: 'Review order history and track sales performance to understand how the restaurant is doing.' },
  { icon: Receipt, title: 'Accounting', text: 'Log expenses and view profit and loss figures alongside your sales.' }
];
</script>

<template>
  <section id="features" class="py-16 md:py-24">
    <div class="max-w-6xl mx-auto px-5">
      <div class="max-w-2xl">
        <p class="text-[13px] font-bold tracking-wider text-teal-600 uppercase">Features</p>
        <h2 class="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Everything the floor and the back office need
        </h2>
      </div>

      <div class="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <article
          v-for="f in features"
          :key="f.title"
          class="p-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-md hover:shadow-slate-900/5 transition-all"
        >
          <span class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <component :is="f.icon" class="w-5 h-5" />
          </span>
          <h3 class="mt-4 text-[17px] font-bold text-slate-900">{{ f.title }}</h3>
          <p class="mt-2 text-[14.5px] leading-relaxed text-slate-600">{{ f.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
