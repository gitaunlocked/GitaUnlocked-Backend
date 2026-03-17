export default defineNuxtConfig({
  nitro: {
    preset: 'node-server',
    prerender: {
      crawlLinks: false,
      routes: []
    }
  },
  runtimeConfig: {
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    public: {
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || ''
    }
  }
})
