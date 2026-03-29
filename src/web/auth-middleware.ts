import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';

const PASSWORD = process.env.MD2RED_PASSWORD || '';
const TOKEN_COOKIE = 'md2red_token';

// Generate a stable token from the password (so it survives server restart)
function generateToken(password: string): string {
  return createHash('sha256').update(`md2red:${password}:${randomBytes(0).toString()}`).digest('hex');
}

const validToken = PASSWORD ? generateToken(PASSWORD) : '';

export function isAuthEnabled(): boolean {
  return !!PASSWORD;
}

export function checkAuth(req: IncomingMessage): boolean {
  if (!PASSWORD) return true; // No password set, skip auth

  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[TOKEN_COOKIE] === validToken;
}

export function handleLogin(req: IncomingMessage, res: ServerResponse, body: string): void {
  try {
    const { password } = JSON.parse(body);
    if (password === PASSWORD) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `${TOKEN_COOKIE}=${validToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`,
      });
      res.end(JSON.stringify({ ok: true }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: '密码错误' }));
    }
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: '请求格式错误' }));
  }
}

export function handleLogout(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Set-Cookie': `${TOKEN_COOKIE}=; Path=/; HttpOnly; Max-Age=0`,
  });
  res.end(JSON.stringify({ ok: true }));
}

export function serveLoginPage(res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>md2red 登录</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'PingFang SC',sans-serif;background:#0f0f0f;color:#e0e0e0;display:flex;align-items:center;justify-content:center;height:100vh}
.box{background:#161616;border:1px solid #222;border-radius:16px;padding:48px;width:360px;text-align:center}
h1{font-size:24px;margin-bottom:8px}
p{font-size:13px;color:#666;margin-bottom:32px}
input{width:100%;padding:12px 16px;border-radius:8px;border:1px solid #333;background:#1a1a1a;color:#e0e0e0;font-size:14px;margin-bottom:16px;outline:none}
input:focus{border-color:#6366f1}
button{width:100%;padding:12px;border-radius:8px;border:none;background:#6366f1;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
button:hover{background:#5558e6}
.error{color:#f87171;font-size:13px;margin-bottom:12px;display:none}
</style></head>
<body>
<div class="box">
  <h1>md2red</h1>
  <p>请输入访问密码</p>
  <div class="error" id="err"></div>
  <input type="password" id="pwd" placeholder="密码" autofocus onkeydown="if(event.key==='Enter')login()"/>
  <button onclick="login()">登录</button>
</div>
<script>
async function login(){
  const pwd=document.getElementById('pwd').value;
  const err=document.getElementById('err');
  err.style.display='none';
  const res=await fetch('/api/console-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd})});
  const data=await res.json();
  if(data.ok){location.reload();}
  else{err.textContent=data.error||'登录失败';err.style.display='block';}
}
</script>
</body></html>`);
}

function parseCookies(cookieStr: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieStr.split(';').forEach((pair) => {
    const [key, ...val] = pair.trim().split('=');
    if (key) cookies[key] = val.join('=');
  });
  return cookies;
}
