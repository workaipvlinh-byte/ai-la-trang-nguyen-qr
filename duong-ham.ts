/**
 * Đường hầm Cloudflare bản nhanh (không cần tài khoản): cho điện thoại ở bất cứ đâu vào được cổng điện thoại.
 * Chạy bin/cloudflared.exe, đọc địa chỉ https://xxx.trycloudflare.com nó in ra.
 * Không có file / không có mạng / lỗi thì trang host dùng địa chỉ Wi-Fi nội bộ (chỉ máy cùng Wi-Fi vào được).
 * Giới hạn của bản nhanh (tài liệu Cloudflare): tối đa 200 yêu cầu đang xử lý cùng lúc, không hỗ trợ SSE, không cam kết luôn chạy.
 */
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

export type DuongHam = { trang: 'tat' | 'dang-mo' | 'chay' | 'loi'; url: string; loi: string };

export function moDuongHam(o: { dir: string; port: number; doi: (d: DuongHam) => void }) {
  const exe = path.join(o.dir, 'bin', 'cloudflared.exe');
  let d: DuongHam = { trang: 'tat', url: '', loi: '' };
  const dat = (p: Partial<DuongHam>) => o.doi((d = { ...d, ...p }));
  let proc: ChildProcess | null = null;
  let lanThu = 0;

  const chay = () => {
    if (!fs.existsSync(exe)) return dat({ trang: 'loi', loi: 'Thiếu file bin/cloudflared.exe' });
    dat({ trang: 'dang-mo', url: '', loi: '' });
    proc = spawn(exe, ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${o.port}`], { windowsHide: true });
    const doc = (buf: Buffer) => {
      const m = buf.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m && d.url !== m[0]) {
        lanThu = 0;
        dat({ trang: 'chay', url: m[0] });
        console.log(`[Đường hầm] Người chơi vào: ${m[0]}`);
      }
    };
    proc.stdout?.on('data', doc);
    proc.stderr?.on('data', doc); // cloudflared in địa chỉ ra stderr
    proc.on('exit', () => {
      proc = null;
      // rớt thì mở lại (địa chỉ mới, trang host tự đổi mã QR); thử 5 lần liền không được thì thôi
      if (++lanThu > 5) return dat({ trang: 'loi', url: '', loi: 'Không mở được đường hầm (máy không có mạng?)' });
      dat({ trang: 'dang-mo', url: '' });
      setTimeout(chay, 5000 * lanThu);
    });
  };
  chay();
  const tat = () => proc?.kill();
  process.on('exit', tat);
  process.on('SIGINT', () => (tat(), process.exit()));
}
