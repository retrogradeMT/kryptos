import process from 'node:process'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,
  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      crawlLinks: true,
      routes: ['/'], // Starting point for the crawler
    },
  },
  compatibilityDate: '2024-11-01',
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico',
        },
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
        },
      ],
    },
  },
  css: [
    '~/assets/css/global.css', // ✅ Keep global styles only
  ],
  modules: ['@nuxtjs/tailwindcss', '@vee-validate/nuxt', 'nitro-cloudflare-dev'],
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
    server: {
      hmr: {
        port: 3000, // Make sure this port matches your Nuxt server port
        clientPort: 3000, // Ensure this matches your Nuxt server port as well
      },
    },
  },
  devtools: { enabled: false },
  runtimeConfig: {
    // These values are only available on the server
    cfAccountId: process.env.NUXT_CF_ACCOUNT_ID,
    cfKVNamespaceId: process.env.NUXT_CF_KV_NAMESPACE_ID,
    cfApiToken: process.env.NUXT_CF_API_TOKEN,

    public: {}, // nothing here unless you want it client-exposed
  },
})
