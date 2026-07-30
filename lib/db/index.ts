// Re-export the public API of lib/db so callers can import from 'lib/db'.
export { supabase } from './client'
export {
  getAllModels,
  getModelById,
  getModelsByProvider,
  getModelsByCapability,
} from './models'
export type {
  DbModel,
  DbModelModality,
  DbModelCapability,
  DbModelPricing,
  DbModelBenchmarks,
  DbModelStrength,
  DbModelWeakness,
  DbModelLinks,
} from './schema'
