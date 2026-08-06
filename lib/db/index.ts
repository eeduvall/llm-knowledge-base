// Re-export the public API of lib/db so callers can import from '@/lib/db'.
export { getDb } from './client'
export {
  getAllModels,
  getModelById,
  getModelsByProvider,
  getModelsByCapability,
} from './models'
