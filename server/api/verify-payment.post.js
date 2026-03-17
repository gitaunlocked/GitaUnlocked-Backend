import { createHmac } from 'crypto'
import { getAdminDb } from '../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, enrollmentId } = body

  // Validate all required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !enrollmentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required payment verification fields'
    })
  }

  try {
    const config = useRuntimeConfig()
    const db = getAdminDb()

    // Verify Razorpay signature (HMAC SHA256)
    const expectedSignature = createHmac('sha256', config.razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Payment verification failed. Invalid signature.'
      })
    }

    // Signature is valid — update enrollment in Firestore
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId)
    const enrollmentDoc = await enrollmentRef.get()

    if (!enrollmentDoc.exists) {
      throw createError({ statusCode: 404, statusMessage: 'Enrollment not found' })
    }

    const enrollment = enrollmentDoc.data()

    // Verify the order ID matches what we stored
    if (enrollment.razorpayOrderId !== razorpay_order_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Order ID mismatch. Payment cannot be verified.'
      })
    }

    // Prevent double-processing
    if (enrollment.status === 'completed') {
      return { success: true, message: 'Payment already verified', alreadyCompleted: true }
    }

    // Update enrollment to completed
    await enrollmentRef.update({
      status: 'completed',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paidAt: new Date().toISOString()
    })

    return {
      success: true,
      message: 'Payment verified successfully'
    }
  } catch (err) {
    if (err.statusCode) throw err

    console.error('Verify payment error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Payment verification failed. Please contact support.'
    })
  }
})
