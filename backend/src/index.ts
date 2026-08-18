import 'dotenv/config'
import { createApp } from './app'
import { connectToDatabase } from './db'

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI

async function main() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required')
  }

  await connectToDatabase(MONGODB_URI)
  console.log('Connected to MongoDB')

  const app = createApp()
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
