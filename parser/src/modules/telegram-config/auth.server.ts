import { createServer, IncomingMessage, ServerResponse } from 'http';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { TelegramConfigApi } from './telegram-config.api.js';

interface PendingAuth {
  client: TelegramClient;
  phone: string;
  apiId: number;
  apiHash: string;
}

let pendingAuth: PendingAuth | null = null;

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function startAuthServer(configApi: TelegramConfigApi, port = 3002): void {
  const server = createServer(async (req, res) => {
    const url = req.url || '';
    const method = req.method || '';

    // Статус
    if (method === 'GET' && url === '/internal/status') {
      json(res, 200, { success: true, data: { hasPendingAuth: !!pendingAuth } });
      return;
    }

    // Шаг 1: отправить код на телефон
    if (method === 'POST' && url === '/internal/auth/send-code') {
      try {
        const { apiId, apiHash, phone } = await readBody(req);
        if (!apiId || !apiHash || !phone) {
          json(res, 400, { success: false, message: 'apiId, apiHash, phone required' });
          return;
        }

        if (pendingAuth) {
          try { await pendingAuth.client.disconnect(); } catch {}
          pendingAuth = null;
        }

        const client = new TelegramClient(new StringSession(''), Number(apiId), apiHash, {
          connectionRetries: 3,
        });
        await client.connect();

        const result = await client.sendCode({ apiId: Number(apiId), apiHash }, phone);
        pendingAuth = { client, phone, apiId: Number(apiId), apiHash };

        console.log(`📱 Код отправлен на ${phone}`);
        json(res, 200, { success: true, data: { phoneCodeHash: result.phoneCodeHash } });
      } catch (e: any) {
        console.error('❌ send-code error:', e.message);
        json(res, 500, { success: false, message: e.message });
      }
      return;
    }

    // Шаг 2: подтвердить код
    if (method === 'POST' && url === '/internal/auth/verify-code') {
      try {
        if (!pendingAuth) {
          json(res, 400, { success: false, message: 'Нет ожидающей авторизации. Сначала вызовите send-code.' });
          return;
        }

        const { code, phoneCodeHash } = await readBody(req);
        if (!code || !phoneCodeHash) {
          json(res, 400, { success: false, message: 'code and phoneCodeHash required' });
          return;
        }

        const { client, phone, apiId, apiHash } = pendingAuth;

        await client.signIn(
          { apiId, apiHash },
          { phoneNumber: phone, phoneCodeHash, phoneCode: code },
        );

        const session = client.session.save() as unknown as string;
        await configApi.saveSession(session);

        pendingAuth = null;
        console.log('✅ Telegram авторизация завершена, сессия сохранена');
        json(res, 200, { success: true, data: { message: 'Авторизация успешна. Перезапустите парсер.' } });

        // Перезапуск через политику docker restart
        setTimeout(() => process.exit(0), 500);
      } catch (e: any) {
        console.error('❌ verify-code error:', e.message);
        json(res, 500, { success: false, message: e.message });
      }
      return;
    }

    json(res, 404, { success: false, message: 'Not found' });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Auth server запущен на порту ${port}`);
    console.log('⏳ Ожидаем авторизацию через веб-интерфейс...');
  });
}
