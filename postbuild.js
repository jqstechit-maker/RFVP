import fs from 'fs';
import path from 'path';

const dirsToCopy = ['admin', 'app', 'config'];
const filesToCopy = ['rifa_banco.sql'];

const distPath = path.resolve('dist');

// Função auxiliar para copiar recursivamente
function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

console.log('🏁 Iniciando pós-processamento da Build para a Hostinger...');

dirsToCopy.forEach(dir => {
  const source = path.resolve(dir);
  const destination = path.join(distPath, dir);
  if (fs.existsSync(source)) {
    console.log(`Copying folder: ${dir} -> dist/${dir}`);
    copyFolderSync(source, destination);
  } else {
    console.warn(`Aviso: Diretório ${dir} não encontrado para cópia.`);
  }
});

filesToCopy.forEach(file => {
  const source = path.resolve(file);
  const destination = path.join(distPath, file);
  if (fs.existsSync(source)) {
    console.log(`Copying file: ${file} -> dist/${file}`);
    fs.copyFileSync(source, destination);
  }
});

console.log('✅ Tudo pronto! A pasta "dist" agora contém todos os códigos do React e PHP de forma integrada e completa.');
