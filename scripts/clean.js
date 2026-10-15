import fs from 'node:fs';

try {
  fs.rmSync('./dist', { recursive: true, force: true });
  console.log('Cleaned ./dist directory');
} catch (error) {
  console.error('Error cleaning dist:', error);
}
