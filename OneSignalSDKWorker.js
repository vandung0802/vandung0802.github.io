importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Proxy: page gửi message → SW fetch OneSignal API (bypass SW interception)
self.addEventListener('message', async function(event) {
  if (!event.data || event.data.type !== 'OS_REGISTER') return;
  try {
    const resp = await fetch('https://api.onesignal.com/api/v1/players', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(event.data.payload)
    });
    const data = await resp.json();
    if (event.source) event.source.postMessage({type: 'OS_REGISTER_RESULT', data: data});
  } catch(e) {
    if (event.source) event.source.postMessage({type: 'OS_REGISTER_RESULT', error: e.message});
  }
});
