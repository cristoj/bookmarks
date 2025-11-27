#!/usr/bin/env node

/**
 * Script para verificar si los emuladores de Firebase están corriendo
 * antes de ejecutar los tests
 */

const http = require('http');

const emulators = [
  { name: 'Firestore', host: '127.0.0.1', port: 8080 },
  { name: 'Auth', host: '127.0.0.1', port: 9099 },
  { name: 'Storage', host: '127.0.0.1', port: 9199 },
];

function checkEmulator(emulator) {
  return new Promise((resolve) => {
    const options = {
      host: emulator.host,
      port: emulator.port,
      path: '/',
      timeout: 1000,
    };

    const req = http.request(options, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function checkAllEmulators() {
  console.log('Verificando emuladores de Firebase...\n');

  let allRunning = true;

  for (const emulator of emulators) {
    const isRunning = await checkEmulator(emulator);
    const status = isRunning ? '✓ Running' : '✗ Not running';
    const statusColor = isRunning ? '\x1b[32m' : '\x1b[31m';

    console.log(
      `${statusColor}${status}\x1b[0m - ${emulator.name} Emulator (${emulator.host}:${emulator.port})`
    );

    if (!isRunning) {
      allRunning = false;
    }
  }

  console.log('');

  if (!allRunning) {
    console.log('\x1b[33m⚠ No todos los emuladores están corriendo\x1b[0m');
    console.log('\nPara iniciar los emuladores, ejecuta:');
    console.log('  firebase emulators:start\n');
    console.log('O en una terminal separada:');
    console.log('  firebase emulators:start --only firestore,auth,storage\n');
    process.exit(1);
  } else {
    console.log('\x1b[32m✓ Todos los emuladores están corriendo correctamente\x1b[0m\n');
    process.exit(0);
  }
}

checkAllEmulators();
