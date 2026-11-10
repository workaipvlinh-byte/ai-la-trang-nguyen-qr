// Đóng gói bản quét QR thành 1 file zip chạy ngay, không cần cài gì: npm run dong-goi
// Gói có sẵn: Node.js (node/node.exe), thư viện (node_modules), cloudflared (bin/), giao diện đã dựng (dist/).
// Ra: ban-phat-hanh/TrangNguyen-QR.zip (thư mục ban-phat-hanh không đưa vào git)
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'ban-phat-hanh');
const CACHE = path.join(OUT, '_cache');
const TEN = 'TrangNguyen-QR';
const GOI = path.join(OUT, TEN);
const NODE_DONG = 'latest-v24.x'; // Node LTS cùng đời máy làm game
const chay = (cmd, cwd = ROOT) => execSync(cmd, { cwd, stdio: 'inherit' });
// tar có sẵn của Windows (đọc và tạo được file zip); tar của Git Bash thì không
const TAR = `"${path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')}"`;
const chep = (tu, den) => fs.cpSync(path.join(ROOT, tu), path.join(GOI, den ?? tu), { recursive: true });

async function taiVe(url, dich) {
  if (fs.existsSync(dich)) return;
  console.log('Tải', url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Tải lỗi ${r.status}: ${url}`);
  fs.writeFileSync(dich, Buffer.from(await r.arrayBuffer()));
}

fs.mkdirSync(CACHE, { recursive: true });
fs.rmSync(GOI, { recursive: true, force: true });
fs.mkdirSync(GOI, { recursive: true });

// 1. Giao diện bản chạy thật (chỉ lấy file dựng ra, bỏ ảnh gốc mà công cụ dựng chép theo)
chay('npx vite build');
fs.mkdirSync(path.join(GOI, 'dist', 'assets'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'dist', 'index.html'), path.join(GOI, 'dist', 'index.html'));
for (const f of fs.readdirSync(path.join(ROOT, 'dist', 'assets'))) {
  if (/^index-.*\.(js|css)$/.test(f)) fs.copyFileSync(path.join(ROOT, 'dist', 'assets', f), path.join(GOI, 'dist', 'assets', f));
}

// 2. Mã server + trang điện thoại + ảnh đã cắt gọn (không lấy ảnh gốc nặng)
for (const f of ['server.ts', 'choi.ts', 'duong-ham.ts', 'package.json', 'package-lock.json', 'tsconfig.json', 'LICENSE']) chep(f);
chep('phone');
chep('src/live', 'src/live');
fs.mkdirSync(path.join(GOI, 'public', 'assets', 'bg'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'public/assets/bg/nen2.jpg'), path.join(GOI, 'public/assets/bg/nen2.jpg'));
chep('public/assets/nv');
if (fs.existsSync(path.join(ROOT, 'public/assets/sfx'))) chep('public/assets/sfx');
chep('bin/cloudflared.exe');

// 3. Chỉ thư viện máy chủ cần lúc chạy. React, vite, tailwind... đã dựng sẵn vào dist nên bỏ.
// Bỏ qua script cài đặt: thư viện giọng đọc có 1 script hỏng trên máy có tên chứa dấu &
const CHAY = ['dotenv', 'express', 'msedge-tts', 'qrcode', 'tiktok-live-connector', 'tsx'];
const pk = JSON.parse(fs.readFileSync(path.join(GOI, 'package.json'), 'utf8'));
pk.dependencies = Object.fromEntries(CHAY.map((k) => [k, pk.dependencies[k]]));
delete pk.devDependencies;
pk.scripts = { start: 'tsx server.ts' };
fs.writeFileSync(path.join(GOI, 'package.json'), JSON.stringify(pk, null, 2) + '\n');
chay('npm install --omit=dev --ignore-scripts --no-audit --no-fund', GOI);

// 4. Node.js bản rời (chỉ node.exe), kiểm tra mã băm với danh sách chính thức của nodejs.org
const goc = `https://nodejs.org/dist/${NODE_DONG}/`;
const sums = await (await fetch(goc + 'SHASUMS256.txt')).text();
const dong = sums.split('\n').find((l) => /node-v[\d.]+-win-x64\.zip$/.test(l.trim()));
const [bam, tenZip] = dong.trim().split(/\s+/);
const zipNode = path.join(CACHE, tenZip);
await taiVe(goc + tenZip, zipNode);
if (crypto.createHash('sha256').update(fs.readFileSync(zipNode)).digest('hex') !== bam) throw new Error('Mã băm Node.js không khớp');
const thuMuc = tenZip.replace(/\.zip$/, '');
chay(`${TAR} -xf "${zipNode}" "${thuMuc}/node.exe" "${thuMuc}/LICENSE"`, CACHE);
fs.mkdirSync(path.join(GOI, 'node'), { recursive: true });
fs.copyFileSync(path.join(CACHE, thuMuc, 'node.exe'), path.join(GOI, 'node', 'node.exe'));

// 5. Giấy phép của phần mềm đi kèm
fs.mkdirSync(path.join(GOI, 'giay-phep'), { recursive: true });
fs.copyFileSync(path.join(CACHE, thuMuc, 'LICENSE'), path.join(GOI, 'giay-phep', 'nodejs-LICENSE.txt'));
await taiVe('https://raw.githubusercontent.com/cloudflare/cloudflared/master/LICENSE', path.join(CACHE, 'cloudflared-LICENSE.txt'));
fs.copyFileSync(path.join(CACHE, 'cloudflared-LICENSE.txt'), path.join(GOI, 'giay-phep', 'cloudflared-LICENSE.txt'));

// 6. File bấm đúp + hướng dẫn
for (const f of ['MO-TRUONG-THI.bat', 'HUONG-DAN.txt']) fs.copyFileSync(path.join(ROOT, 'goi', f), path.join(GOI, f));

// 7. Nén
const zip = path.join(OUT, `${TEN}.zip`);
fs.rmSync(zip, { force: true });
chay(`${TAR} -a -c -f "${zip}" "${TEN}"`, OUT);
const mb = (fs.statSync(zip).size / 1024 / 1024).toFixed(0);
console.log(`\nXong: ${zip} (${mb} MB)`);
