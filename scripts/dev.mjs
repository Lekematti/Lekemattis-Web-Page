import net from 'node:net';
import { spawn } from 'node:child_process';

async function isPortFree(port) {
  return await new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once('error', () => resolve(false));
    server.listen({ port }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findFreePort(startPort, maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const port = startPort + i;
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found in range ${startPort}-${startPort + maxAttempts - 1}`);
}

function spawnNpm(args, extraEnv) {
  const env = { ...process.env, ...extraEnv };

  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/d', '/s', '/c', 'npm', ...args], {
      stdio: 'inherit',
      env,
    });
  }

  return spawn('npm', args, {
    stdio: 'inherit',
    env,
  });
}

function run() {
  return (async () => {
    const port = await findFreePort(Number(process.env.PORT_BASE ?? 3002));

    console.log(`[dev] Starting backend on port ${port}`);

    const backend = spawn('node', ['Backend/src/server.js'], {
      stdio: 'inherit',
      env: { ...process.env, PORT: String(port) },
    });

    console.log(`[dev] Starting frontend with BACKEND_PORT=${port}`);

    const frontend = spawnNpm(['--workspace', 'Frontend', 'run', 'dev'], {
      BACKEND_PORT: String(port),
    });

    backend.on('error', (err) => {
      console.error('[dev] Backend failed to start:', err);
      if (!frontend.killed) frontend.kill('SIGTERM');
      process.exit(1);
    });

    frontend.on('error', (err) => {
      console.error('[dev] Frontend failed to start:', err);
      if (!backend.killed) backend.kill('SIGTERM');
      process.exit(1);
    });

    const shutdown = (signal) => {
      if (!backend.killed) backend.kill(signal);
      if (!frontend.killed) frontend.kill(signal);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    const exit = (code) => {
      shutdown('SIGTERM');
      process.exit(code);
    };

    backend.on('exit', (code) => exit(code ?? 1));
    frontend.on('exit', (code) => exit(code ?? 1));
  })();
}

run().catch((err) => {
  console.error('[dev] Failed to start dev servers:', err);
  process.exit(1);
});
