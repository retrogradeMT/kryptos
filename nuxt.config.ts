import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: false,
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
        {
          rel: 'stylesheet',
          href: 'https://use.typekit.net/eud2szv.css', // <-- Adobe Fonts
        },
      ],
    },
  },
  css: [
    '~/assets/css/global.css', // ✅ Keep global styles only
  ],
  modules: ['@vee-validate/nuxt', 'nitro-cloudflare-dev', 'shadcn-nuxt'],
  tailwindcss: {
    // Make detection unambiguous for tooling
    configPath: 'tailwind.config.js',
  },
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
    plugins: [
      tailwindcss(),
    ],
    server: {
      hmr: {
        port: 3000,
        clientPort: 3000,
      },
    },
  },
  shadcn: {
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui',
  },
  devtools: { enabled: true },
  runtimeConfig: {
    cfAccountId: process.env.NUXT_CF_ACCOUNT_ID,
    cfKVNamespaceId: process.env.NUXT_CF_KV_NAMESPACE_ID,
    cfApiToken: process.env.NUXT_CF_API_TOKEN,

    public: {},
  },
})
