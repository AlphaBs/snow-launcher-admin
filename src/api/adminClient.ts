import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './schema'
import { useAuthStore } from '@/stores/auth'

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const auth = useAuthStore()
    if (auth.credentials) {
      request.headers.set('Authorization', `Basic ${auth.credentials}`)
    }
    return request
  },
}

const adminClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
})

adminClient.use(authMiddleware)

export default adminClient
