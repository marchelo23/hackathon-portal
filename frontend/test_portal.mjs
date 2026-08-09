import { Portal } from '@portalsdk/core';

const portal = new Portal({ apiKey: 'pk_lgVt_cPt2TfKuUZjuPDsprmvc859V0TLLauDNJ4FJ3I' });

const name = 'Agent1';
const roomCode = 'TESTROOM';

const listenerChannel = portal.channel(`lobby-events-${name}`);
listenerChannel.acquire();

listenerChannel.on('message', (msg) => {
  console.log('Received message on lobby-events:', msg);
});

setTimeout(() => {
  console.log('Sending join_request');
  portal.channel('lobby-system').send({
    content: { type: 'join_request', roomId: roomCode, name: name, role: 'Negotiator', playerId: name }
  });
}, 1000);

setTimeout(() => {
  console.log('Test finished');
  process.exit(0);
}, 20000);
