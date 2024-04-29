import fs from 'fs';

export function readFileFromDisk(location?: string): Buffer | undefined {
  if (!location) return undefined;
  return fs.readFileSync(location);
}
