import { NextResponse } from 'next/server';

const SMS_API_KEY = process.env.SMSONLINEGH_API_KEY;
const SMS_URL     = 'https://api.smsonlinegh.com/v5/message/sms/send';

// ── Phone normalisation ───────────────────────────────────────────────────────
// SMSOnlineGH expects international format without '+': 233XXXXXXXXX
function normalizePhone(phone) {
  if (!phone) return null;
  const s = String(phone).replace(/[\s\-().+]/g, '');

  if (s.startsWith('233') && s.length === 12) return s;
  if (s.startsWith('0')   && s.length === 10) return '233' + s.slice(1);
  if (/^\d{9}$/.test(s))                      return '233' + s;

  return null;
}

const HANDSHAKE_MESSAGES = {
  0:    'Success',
  1101: 'Invalid response content type',
  1102: 'Invalid request content type',
  1201: 'Invalid authentication model',
  1202: 'Invalid authentication PID',
  1203: 'Authentication failed — check your API key',
  1204: 'API access is disabled on this account',
  1401: 'Missing request data',
  1402: 'Bad request',
  1403: 'Internal server error',
  1405: 'Access denied',
  1406: 'API version retired',
  1407: 'Service not granted',
  1408: 'Account inactive',
  1409: 'Account suspended',
  1502: 'Invalid destinations',
  1503: 'Missing or invalid request parameter',
};

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { recipients, message, senderId } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!SMS_API_KEY) {
      return NextResponse.json({ error: 'SMS service is not configured' }, { status: 500 });
    }

    // Normalise phone numbers and track which were invalid
    const valid   = [];
    const invalid = [];

    for (const r of recipients) {
      const phone = normalizePhone(r.phone);
      if (phone) {
        valid.push({ ...r, normalizedPhone: phone });
      } else {
        invalid.push({ name: r.name, phone: r.phone, success: false, error: 'Invalid phone number format' });
      }
    }

    if (valid.length === 0) {
      return NextResponse.json({
        success: true,
        summary: { total: recipients.length, successful: 0, failed: recipients.length },
        results: invalid,
      });
    }

    const effectiveSender = (senderId && senderId.trim()) ? senderId.trim().slice(0, 11) : 'Didi Jollof';
    const phones = valid.map((r) => r.normalizedPhone);

    const body = JSON.stringify({
      text:         message.trim(),
      type:         0,
      sender:       effectiveSender,
      destinations: phones,
    });

    console.log('[SMS] POST', SMS_URL);
    console.log('[SMS] Sender:', effectiveSender, '| Recipients:', phones.length, phones);

    const response = await fetch(SMS_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'Authorization': `key ${SMS_API_KEY}`,
      },
      body,
    });

    const rawText = await response.text();
    console.log('[SMS] HTTP status:', response.status);
    console.log('[SMS] Response:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[SMS] Failed to parse response as JSON');
      return NextResponse.json({ error: 'Invalid response from SMS provider' }, { status: 502 });
    }

    const code         = data?.handshake?.id ?? null;
    const ok           = code === 0;
    const handshakeMsg = HANDSHAKE_MESSAGES[code] ?? `Unknown handshake code: ${code}`;

    console.log('[SMS] Handshake code:', code, '| OK:', ok, '|', handshakeMsg);

    // Build a map of per-destination delivery status from the response
    const destStatusMap = {};
    if (ok && Array.isArray(data?.data?.destinations)) {
      for (const d of data.data.destinations) {
        // Any status that is NOT a rejection is considered delivered to carrier
        const delivered = !d.status?.label?.startsWith('DS_REJECTED');
        destStatusMap[d.to] = {
          success: delivered,
          error:   delivered ? null : (d.status?.label ?? 'Delivery rejected'),
        };
      }
    }

    const results = [
      ...valid.map((r) => {
        if (!ok) return { name: r.name, phone: r.phone, success: false, error: handshakeMsg };
        const dest = destStatusMap[r.normalizedPhone];
        return {
          name:    r.name,
          phone:   r.phone,
          success: dest ? dest.success : true,
          error:   dest ? dest.error   : null,
        };
      }),
      ...invalid,
    ];

    const successful = results.filter((r) => r.success).length;
    const failed     = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: { total: recipients.length, successful, failed },
      handshake: { code, message: handshakeMsg },
      results,
    });
  } catch (error) {
    console.error('[SMS] Route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
