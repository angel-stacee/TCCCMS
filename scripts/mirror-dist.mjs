import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

if (fs.existsSync(distDir)) {
    fs.cpSync(distDir, publicDir, { recursive: true });
    console.log('[deploy] Successfully mirrored dist/ to public/ for Repohive deployment');
}
