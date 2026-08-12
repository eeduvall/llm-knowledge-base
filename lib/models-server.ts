// Server-only: reads model data from the YAML file on disk.
// Do NOT import this file in client components.
import * as yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import type { Model } from './models';

export function loadModels(): Model[] {
  const filePath = path.join(process.cwd(), 'data', 'models.yaml');
  const raw = fs.readFileSync(filePath, 'utf8');
  return yaml.load(raw) as Model[];
}
