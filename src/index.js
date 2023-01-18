addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request))
});

addEventListener("scheduled", (event) => {
    event.waitUntil(handleCron());
});

const LAST_PING = 'lastPing';
const CONN = 'connected';
const DISCONN = 'disconnected';
const SECONDS_AS_DISCONNECTED = 60 * 5; //5 min

async function sendMessage(message) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${message}`);
}

function secondsDiff(start, end) {
    return Math.round(Math.abs(end.valueOf() - start.valueOf()) / 1000);
}

async function handleRequest(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get('a');
    if (action !== 'ping') {
        return new Response('fuck off!');
    }

    const now = Date.now();
    await HATA.put(LAST_PING, now);

    console.log(`updating to ${now}`);

    return new Response('updated');
}

async function handleCron() {
    const now = new Date();
    const before = await HATA.get(LAST_PING);
    const diff = secondsDiff(new Date(+before), now);

    console.log({now: now.valueOf(), before: before, diff});

    const prevStatus = await HATA.get("status");

    if (diff < SECONDS_AS_DISCONNECTED) {
        if (prevStatus === CONN) {
            return new Response('ok');
        }

        // await sendMessage('Hata is connected');
        await HATA.put('status', CONN);
        
        return new Response('ok');
    }

    if (prevStatus === DISCONN) {
        return new Response('ok');
    }

    await sendMessage('Hata is not connected');
    await HATA.put('status', DISCONN);

    return new Response('ok');
}
