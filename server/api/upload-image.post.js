import { readMultipartFormData } from 'h3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)

  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const file = files.find(f => f.name === 'image')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'No image field found' })
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file type. Allowed: png, jpg, webp, svg, gif' })
  }

  // Validate file size (max 5MB)
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: 'File too large. Max 5MB.' })
  }

  // Generate unique filename
  const ext = file.filename?.split('.').pop() || 'png'
  const filename = `${randomUUID()}.${ext}`

  // Save to public/uploads/courses/
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'courses')
  await mkdir(uploadDir, { recursive: true })

  const filePath = join(uploadDir, filename)
  await writeFile(filePath, file.data)

  // Return the public URL
  return {
    url: `/uploads/courses/${filename}`
  }
})
