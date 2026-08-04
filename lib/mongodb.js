import { MongoClient } from 'mongodb'

let clientPromise

function getClientPromise() {
  if (!global._mongoClientPromise) {
    const uri = process.env.MONGO_URL
    if (!uri) throw new Error('MONGO_URL is not set')
    const client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  return global._mongoClientPromise
}

export async function getDb() {
  const c = await getClientPromise()
  return c.db(process.env.DB_NAME)
}

export default { get: getClientPromise }
