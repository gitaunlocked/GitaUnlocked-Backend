import { getAdminDb } from '../utils/firebase-admin'
import { getRazorpay } from '../utils/razorpay'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { enrollmentId } = body

  if (!enrollmentId) {
    throw createError({ statusCode: 400, statusMessage: 'enrollmentId is required' })
  }

  try {
    const db = getAdminDb()
    const razorpay = getRazorpay()

    // Fetch enrollment from Firestore
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId)
    const enrollmentDoc = await enrollmentRef.get()

    if (!enrollmentDoc.exists) {
      throw createError({ statusCode: 404, statusMessage: 'Enrollment not found' })
    }

    const enrollment = enrollmentDoc.data()

    // Validate enrollment is pending payment
    if (enrollment.status === 'completed') {
      throw createError({ statusCode: 400, statusMessage: 'This enrollment is already completed' })
    }

    // Validate amount
    const amountInRupees = enrollment.total || enrollment.totalRupees
    if (!amountInRupees || amountInRupees <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid amount. Free enrollments do not require payment.' })
    }

    const amountInPaise = Math.round(amountInRupees * 100)

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: enrollmentId,
      notes: {
        enrollmentId,
        courseSlug: enrollment.courseSlug || '',
        courseTitle: enrollment.courseTitle || '',
        studentName: enrollment.name || '',
        studentEmail: enrollment.email || ''
      }
    })

    // Store order ID on enrollment doc
    await enrollmentRef.update({
      razorpayOrderId: order.id,
      orderCreatedAt: new Date().toISOString()
    })

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: useRuntimeConfig().public.razorpayKeyId
    }
  } catch (err) {
    // Re-throw if it's already an H3 error
    if (err.statusCode) throw err

    console.error('Create order error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create payment order. Please try again.'
    })
  }
})
