import { createHmac } from 'crypto'
import { getAdminDb } from '../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  // Read raw body for signature verification
  const rawBody = await readRawBody(event)
  const signature = getHeader(event, 'x-razorpay-signature')

  if (!signature || !rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook request' })
  }

  const config = useRuntimeConfig()

  // Skip webhook verification if secret not configured yet
  if (!config.razorpayWebhookSecret || config.razorpayWebhookSecret === 'REPLACE_WITH_WEBHOOK_SECRET') {
    console.warn('Razorpay webhook secret not configured. Skipping webhook.')
    return { status: 'skipped', message: 'Webhook secret not configured' }
  }

  // Verify webhook signature
  const expectedSignature = createHmac('sha256', config.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex')

  if (expectedSignature !== signature) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook signature' })
  }

  try {
    const payload = JSON.parse(rawBody)
    const eventType = payload.event

    // Only handle payment.captured events
    if (eventType !== 'payment.captured') {
      return { status: 'ignored', event: eventType }
    }

    const payment = payload.payload?.payment?.entity
    if (!payment) {
      return { status: 'ignored', message: 'No payment entity in payload' }
    }

    const orderId = payment.order_id
    const paymentId = payment.id

    if (!orderId) {
      return { status: 'ignored', message: 'No order_id in payment' }
    }

    const db = getAdminDb()

    // Find enrollment by razorpayOrderId
    const snapshot = await db.collection('enrollments')
      .where('razorpayOrderId', '==', orderId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      console.warn(`Webhook: No enrollment found for order ${orderId}`)
      return { status: 'not_found', orderId }
    }

    const enrollmentDoc = snapshot.docs[0]
    const enrollment = enrollmentDoc.data()

    // Skip if already completed
    if (enrollment.status === 'completed') {
      return { status: 'already_completed', orderId }
    }

    // Update enrollment to completed
    await enrollmentDoc.ref.update({
      status: 'completed',
      razorpayPaymentId: paymentId,
      paidAt: new Date().toISOString(),
      updatedVia: 'webhook'
    })

    console.log(`Webhook: Enrollment ${enrollmentDoc.id} marked as completed via webhook`)
    return { status: 'success', enrollmentId: enrollmentDoc.id }
  } catch (err) {
    console.error('Webhook processing error:', err)
    // Return 200 to prevent Razorpay from retrying (we logged the error)
    return { status: 'error', message: 'Processing failed but acknowledged' }
  }
})
