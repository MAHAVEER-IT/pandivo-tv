const { spawnSync } = require('child_process');
const path = require('path');

const targetScript = path.join(__dirname, '../src/services/runAcceptanceTests.ts');
const result = spawnSync('npx', ['tsx', targetScript], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
});

process.exit(result.status ?? 0);
