import { Portal } from '@portalsdk/core';
const portal = new Portal({ apiKey: 'sk_C8oQgcFUFchFREgvzj0MkcBqvOVomjy4P80NzBspc0s' });
try {
  const c = portal.channel("test space");
  console.log("Acquiring...");
  c.acquire();
  c.on('ready', () => {
    console.log("Ready!");
    process.exit(0);
  });
  c.on('error', (err) => {
    console.error("Error:", err);
    process.exit(1);
  });
} catch(e) {
  console.error("Catch:", e);
}
