import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let adminDb = null

export const getAdminDb = () => {
  if (adminDb) return adminDb

  // Load service account from file
  const filePath = resolve(process.cwd(), 'service-account.json')
  let serviceAccount
  try {
    const raw = readFileSync(filePath, 'utf-8')
    serviceAccount = JSON.parse(raw)
  } catch (e) {
    throw new Error(`Firebase Admin: Could not read service-account.json at ${filePath}. Make sure the file exists.`)
  }

  const app = getApps().length === 0
    ? initializeApp({ credential: cert(serviceAccount) })
    : getApp()

  adminDb = getFirestore(app)
  return adminDb
}
