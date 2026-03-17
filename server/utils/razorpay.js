import Razorpay from 'razorpay'

let razorpayInstance = null

export const getRazorpay = () => {
  if (razorpayInstance) return razorpayInstance

  const config = useRuntimeConfig()

  if (!config.public.razorpayKeyId || config.public.razorpayKeyId === 'rzp_test_REPLACE_WITH_YOUR_KEY') {
    throw new Error('Razorpay: RAZORPAY_KEY_ID is not configured in .env')
  }
  if (!config.razorpayKeySecret || config.razorpayKeySecret === 'REPLACE_WITH_YOUR_SECRET') {
    throw new Error('Razorpay: RAZORPAY_KEY_SECRET is not configured in .env')
  }

  razorpayInstance = new Razorpay({
    key_id: config.public.razorpayKeyId,
    key_secret: config.razorpayKeySecret
  })

  return razorpayInstance
}
