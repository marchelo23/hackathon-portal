import { Portal } from '@portalsdk/core';

const portal = new Portal({ apiKey: 'pk_lgVt_cPt2TfKuUZjuPDsprmvc859V0TLLauDNJ4FJ3I' });
const listenerChannel = portal.channel(`lobby-events-Agent1`);
listenerChannel.acquire();

console.log('Listening to lobby-events-Agent1');

listenerChannel.on('message', (msg) => {
  console.log('Got msg:', JSON.stringify(msg, null, 2));
});
