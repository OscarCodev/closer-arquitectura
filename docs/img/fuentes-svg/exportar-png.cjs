// Requiere Node.js y sharp disponible en node_modules o NODE_PATH.
// Ejecutar: node exportar-png.cjs
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function exportar() {
  const archivos = fs.readdirSync(__dirname).filter(nombre => nombre.endsWith('.svg'));
  for (const nombre of archivos) {
    await sharp(path.join(__dirname, nombre))
      .png()
      .toFile(path.join(__dirname, '..', nombre.replace(/\.svg$/, '.png')));
  }
  console.log(`${archivos.length} imágenes PNG exportadas.`);
}

exportar().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
