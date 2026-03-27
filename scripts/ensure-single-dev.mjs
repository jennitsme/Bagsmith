import { execSync } from 'node:child_process';

const cwd = process.cwd();

try {
  const raw = execSync('ps -ax -o pid=,command=', { encoding: 'utf8' });
  const rows = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const firstSpace = line.indexOf(' ');
      return {
        pid: firstSpace > 0 ? Number(line.slice(0, firstSpace)) : NaN,
        command: firstSpace > 0 ? line.slice(firstSpace + 1) : line,
      };
    })
    .filter((row) => Number.isFinite(row.pid));

  const matches = rows.filter((row) =>
    row.command.includes(`${cwd}/node_modules/.bin/next dev`) ||
    row.command.includes(`next dev`) && row.command.includes(cwd)
  );

  if (matches.length > 0) {
    console.error('\n[dev-guard] Another `next dev` process is already running for this workspace:');
    for (const m of matches) {
      console.error(`  pid=${m.pid} :: ${m.command}`);
    }
    console.error('\nStop the old dev server first (or kill PID), then run npm run dev again.\n');
    process.exit(1);
  }
} catch {
  // If process inspection fails, do not block dev start.
}
