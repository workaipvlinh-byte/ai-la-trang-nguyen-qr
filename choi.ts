/**
 * Bản quét QR: cổng riêng cho điện thoại người chơi (mặc định 3018).
 *
 * Điện thoại KHÔNG vào được cổng điều khiển (3017, chỉ máy host). Cổng này chỉ có:
 *   GET  /                      trang chơi (phone/index.html)
 *   POST /api/choi/vao          nhập tên, chọn đội -> trả mã người chơi
 *   POST /api/choi/gui          bấm A/B/C/D, nút cảm xúc, thả tim
 *   GET  /api/choi/trang-thai   câu hỏi đang hiện + điểm của mình (điện thoại hỏi mỗi giây)
 *
 * Mỗi lần bấm được đổi thành 1 "bình luận" giống TikTok rồi đẩy vào game qua SSE,
 * nên luật chơi, giọng ông đồ, sĩ tử, trẻ con... chạy y như bản live.
 * Đường hầm Cloudflare bản nhanh không hỗ trợ SSE, vì vậy điện thoại hỏi trạng thái theo kiểu hỏi-đáp từng giây.
 */
import express from 'express';
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { containsBanned } from './src/live/bannedWords';

const PHE = { bac: 'Bắc', trung: 'Trung', nam: 'Nam' } as const;
const GIOI = { trai: 'trai', gai: 'gái' } as const;
// nút cảm xúc -> câu bình luận mà ông đồ nhận ra (src/game/treu.ts). Không có ô gõ chữ tự do.
const CAM_XUC: Record<string, string> = { kho: 'khó quá', de: 'dễ quá', haha: 'haha', chao: 'chào ông đồ', hay: 'hay quá' };
const TOI_DA_NGUOI = 500;
const IM_LANG_MS = 10 * 60_000; // điện thoại im 10 phút (đóng trang, tắt máy) thì rời trường thi, nhả chỗ

type Nguoi = { ten: string; luot: number[]; thayLuc: number };

export function moCongChoi(o: {
  port: number;
  broadcast: (type: string, data: unknown) => void;
  trangThai: () => any; // ảnh chụp game mới nhất trang stage gửi lên
  caiDat: () => { tieuDe: string };
  dir: string;
}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2kb' }));
  const nguoi = new Map<string, Nguoi>();
  const vaoTheoIp = new Map<string, number[]>();

  // Đường hầm chạy ngay trên máy này nên yêu cầu qua hầm đến từ 127.0.0.1 kèm IP thật ở cf-connecting-ip.
  // Chỉ tin header đó khi đến từ máy này; máy cùng Wi-Fi gửi thẳng thì dùng IP thật của nó (không giả được).
  const laMayNay = (ip: string) => ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  const ipCua = (req: express.Request) => {
    const goc = req.socket.remoteAddress || '';
    const cf = req.headers['cf-connecting-ip'];
    return laMayNay(goc) && typeof cf === 'string' && cf ? cf : goc;
  };
  // dọn người im quá lâu và bộ đếm IP cũ, để kẻ phá không giữ chỗ mãi
  setInterval(() => {
    const now = Date.now();
    for (const [id, n] of nguoi) if (now - n.thayLuc > IM_LANG_MS) nguoi.delete(id);
    for (const [ip, ds] of vaoTheoIp) if (!ds.length || now - ds[ds.length - 1] > 60_000) vaoTheoIp.delete(ip);
  }, 60_000).unref();
  // giới hạn số lần trong 1 khoảng: giữ mốc thời gian gần đây, quá thì từ chối
  const conLuot = (ds: number[], toiDa: number, msKhoang: number, now: number) => {
    while (ds.length && now - ds[0] > msKhoang) ds.shift();
    if (ds.length >= toiDa) return false;
    ds.push(now);
    return true;
  };
  const sachTen = (x: unknown) =>
    typeof x === 'string' ? x.replace(/[\x00-\x1f\x7f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20) : '';
  const binhLuan = (id: string, n: Nguoi, comment: string) =>
    o.broadcast('chat', { username: id, nickname: n.ten, comment, avatar: '', timestamp: Date.now(), createTime: Date.now() });

  app.get('/', (_req, res) => res.sendFile(path.join(o.dir, 'phone', 'index.html')));

  app.post('/api/choi/vao', (req, res) => {
    const now = Date.now();
    const ten = sachTen(req.body?.ten);
    if (!ten) return res.status(400).json({ loi: 'Nhập tên của bạn nhé' });
    if (containsBanned(ten)) return res.status(400).json({ loi: 'Tên này không dùng được, chọn tên khác nhé' });
    const cu = typeof req.body?.id === 'string' ? nguoi.get(req.body.id) : undefined;
    let id = cu ? (req.body.id as string) : '';
    if (!cu) {
      // cả lớp vào qua cùng 1 mạng (cùng IP) nên giới hạn rộng tay: 200 lượt vào mỗi phút mỗi IP
      const ip = ipCua(req);
      if (!vaoTheoIp.has(ip)) vaoTheoIp.set(ip, []);
      if (!conLuot(vaoTheoIp.get(ip)!, 200, 60_000, now)) return res.status(429).json({ loi: 'Vào nhanh quá, đợi chút rồi thử lại' });
      if (nguoi.size >= TOI_DA_NGUOI) return res.status(503).json({ loi: 'Trường thi đã đủ chỗ' });
      id = 'p_' + crypto.randomBytes(6).toString('hex');
    }
    const n: Nguoi = cu ?? { ten, luot: [], thayLuc: now };
    n.ten = ten;
    n.thayLuc = now;
    nguoi.set(id, n);
    // báo game: người này có mặt (đám trẻ con chạy mang tên họ), chọn đội, chọn nhân vật nam / nữ
    const phe = PHE[req.body?.phe as keyof typeof PHE];
    const gioi = GIOI[req.body?.gioi as keyof typeof GIOI];
    if (gioi) binhLuan(id, n, gioi);
    if (phe) binhLuan(id, n, phe);
    else binhLuan(id, n, 'chào ông đồ');
    res.json({ id, ten });
  });

  app.post('/api/choi/gui', (req, res) => {
    const now = Date.now();
    const id = String(req.body?.id || '');
    const n = nguoi.get(id);
    if (!n) return res.status(401).json({ loi: 'vao-lai' }); // server vừa bật lại / im quá lâu: điện thoại tự vào lại bằng tên cũ
    n.thayLuc = now;
    if (!conLuot(n.luot, 6, 2000, now)) return res.status(429).json({ loi: 'Bấm chậm thôi' });
    const loai = String(req.body?.loai || '');
    if (/^[ABCD]$/.test(loai)) binhLuan(id, n, loai);
    else if (CAM_XUC[loai]) binhLuan(id, n, CAM_XUC[loai]);
    else if (loai === 'tim') {
      const so = Math.max(1, Math.min(15, Math.floor(Number(req.body?.so) || 1))); // điện thoại gom tim, gửi 1 lần / giây
      o.broadcast('like', { username: id, nickname: n.ten, likeCount: so });
    } else return res.status(400).json({ loi: 'Nút không hợp lệ' });
    res.json({ ok: true });
  });

  app.get('/api/choi/trang-thai', (req, res) => {
    const v = o.trangThai();
    res.setHeader('Cache-Control', 'no-store');
    if (!v?.phase) return res.json({ phase: 'chua-mo' });
    const id = String(req.query.id || '');
    const n = nguoi.get(id);
    if (n) n.thayLuc = Date.now();
    else if (id) return res.status(401).json({ loi: 'vao-lai' });
    const ban = v.ban?.[id] as [number, number, number, number] | undefined;
    res.json({
      tieuDe: o.caiDat().tieuDe,
      phase: v.phase,
      vongTen: v.vongTen,
      cauSo: v.cauSo,
      tongCau: v.tongCau,
      q: v.q,
      opts: v.opts,
      con: v.con,
      tongGiay: v.tongGiay,
      dung: v.dung,
      latKeo: v.latKeo,
      cuu: v.cuu,
      soNop: v.soNop,
      soSiTu: v.soSiTu,
      soDung: v.ketQua?.soDung ?? null,
      // của mình: điểm, hạng, điểm câu vừa rồi, đáp án đã chọn câu này (-1 = chưa)
      toi: ban ? { diem: ban[0], hang: ban[1], gain: ban[2], chon: ban[3] } : null,
      top: (v.top ?? []).slice(0, 5).map((h: any) => ({ ten: h.name, diem: h.diem })),
    });
  });

  app.listen(o.port, '0.0.0.0', () => console.log(`Cổng điện thoại: http://${ipWifi()[0] ?? 'localhost'}:${o.port}`));
}

/** Địa chỉ IP trong mạng Wi-Fi / LAN của máy host (dự phòng khi không có đường hầm) */
export function ipWifi() {
  const ds: string[] = [];
  for (const [ten, ips] of Object.entries(os.networkInterfaces())) {
    if (/vethernet|virtual|vmware|vbox|loopback|wsl/i.test(ten)) continue;
    for (const ip of ips ?? []) if (ip.family === 'IPv4' && !ip.internal) ds.push(ip.address);
  }
  // mạng nhà / trường hay dùng 192.168.x.x: đưa lên đầu
  return ds.sort((a, b) => Number(!a.startsWith('192.168.')) - Number(!b.startsWith('192.168.')));
}
