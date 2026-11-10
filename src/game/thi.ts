// Lõi game Ai Là Trạng Nguyên: không React, thời gian truyền vào (now) để test được.
// Trang stage chạy 1 bản KyThi, trang điều khiển chỉ vẽ lại ảnh chụp view().
import { GAME, type Level, type Vong } from './config';
import { doanGioi, lenhGioi, lenhMien, type Gioi, type Mien } from './gioiTinh';
import { sinhToan } from './toan';

export interface McQ {
  id: string;
  q: string;
  right: string;
  wrong: string[];
  level: Level;
}

const LEVELS: Level[] = ['de', 'vua', 'kho', 'dinh', 'meo'];

/** Đọc file trắc nghiệm: dòng "[de]" đổi nhóm; mỗi dòng "câu hỏi | đúng | sai | sai | sai" */
export function parseMc(text: string, errors: string[] = []): McQ[] {
  const out: McQ[] = [];
  let level: Level | '' = '';
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const sec = /^\[(\w+)\]$/.exec(line);
    if (sec) {
      level = LEVELS.includes(sec[1] as Level) ? (sec[1] as Level) : '';
      if (!level) errors.push(`dòng ${i + 1}: nhóm lạ ${line}`);
      return;
    }
    const parts = line.split('|').map((s) => s.trim());
    if (!level || parts.length !== 5 || parts.some((p) => !p)) {
      errors.push(`dòng ${i + 1}: sai cú pháp`);
      return;
    }
    const [q, right, ...wrong] = parts;
    out.push({ id: `${q}|${right}`, q, right, wrong, level });
  });
  return out;
}

// "Đáp Án  C." -> "dapanc"
export const plain = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');

/** "a", "C.", "đáp án b", "chọn D", "câu c" -> 0..3; câu nói thường -> null */
export function choiceOf(comment: string): number | null {
  const m = /^(?:dapan|chon|cau)?([abcd])$/.exec(plain(comment));
  return m ? 'abcd'.indexOf(m[1]) : null;
}

/** Điểm 1 câu đúng: đúng ngay = tối đa, sát giờ = diemSan * tối đa */
export function diemDung(max: number, ms: number, totalMs: number) {
  const left = Math.max(0, Math.min(1, 1 - ms / totalMs));
  return Math.round(max * (GAME.diemSan + (1 - GAME.diemSan) * left));
}

export type Phase = 'cho' | 'vong' | 'doc' | 'hoi' | 'chot' | 'dapAn' | 'bangVang' | 'vinhQuy';

export interface SiTu {
  id: string;
  name: string;
  avatar: string;
  diem: number;
  chuoi: number;
  msDung: number; // tổng thời gian các câu đúng, để xếp khi bằng điểm
  vaoLuc: number;
  gain: number; // điểm câu vừa rồi (để hiện +/-)
  saiLien?: number; // sai liền mấy câu (để ông đồ trêu)
}

interface Cau {
  q: McQ;
  opts: string[];
  ans: number;
  vong: number;
}

export type Ev =
  | { t: 'cho' }
  | { t: 'vong'; vong: number }
  | { t: 'doc'; text: string }
  | { t: 'chot' }
  | { t: 'nhac' }
  | { t: 'dapAn'; chu: string; dap: string; soDung: number; soNop: number; nhanh?: string; msNhanh?: number }
  | { t: 'bangVang'; vong: string; dau?: string }
  | { t: 'vinhQuy'; top: string[]; mien?: { mien: Mien; diem: number } }
  | { t: 'cuuTro' }
  | { t: 'thach' }
  | { t: 'dauBang'; name: string }
  | { t: 'mienKem'; mien: Mien }
  | { t: 'saiLien'; id: string; name: string }
  | { t: 'latKeo' };

export interface Hang {
  hang: number;
  id: string;
  name: string;
  avatar: string;
  diem: number;
  danhHieu: string;
  gain: number;
  gioi: Gioi; // chọn ảnh nhân vật nam / nữ
  // dấu hiệu trên tên
  mien?: Mien;
  chuoi: number; // đang đúng liền mấy câu
  trangTruoc: boolean; // Trạng Nguyên ván trước
  dauTuan: boolean; // đang đứng đầu bảng vàng tuần
}

const shuffle = <T,>(a: T[], rand: () => number) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export class KyThi {
  phase: Phase = 'cho';
  endsAt = 0;
  private cauList: Cau[] = [];
  private idx = 0;
  private shownAt = 0;
  private answers = new Map<string, { chon: number; ms: number }>();
  private counts = [0, 0, 0, 0];
  private recent: string[] = []; // tên vừa nộp bài (không lộ đáp án)
  private ketQua: { soDung: number; nhanh: { name: string; ms: number; diem: number }[] } | null = null;
  private skew = 0;
  private skewN = 0;
  private events: Ev[] = [];
  siTu = new Map<string, SiTu>();
  /** Người chơi tự gõ "nam" / "nữ": nhớ cả buổi, qua nhiều ván */
  gioiChon = new Map<string, Gioi>();
  /** Bảng vàng tuần (server cộng dồn điểm các ván trong tuần), chỉ để hiện */
  tuan: { id?: string; name: string; avatar: string; diem: number }[] = [];
  /** Phe miền người chơi chọn (gõ Bắc / Trung / Nam): nhớ cả buổi */
  mienChon = new Map<string, Mien>();
  private trangTruoc: string | null = null; // id Trạng Nguyên ván trước
  private trangMoi: string | null = null;
  /** Cứu trợ bằng tim ở Thi Đình: đủ tim thì loại 2 đáp án sai cho cả phòng */
  private cuu = { tim: 0, xong: false, loai: [] as number[] };
  private dauTruoc: string | null = null; // ai đang dẫn đầu ván
  private dauBaoCau = -99; // câu lần cuối hô đổi ngôi
  private mienBaoCau = 0;

  // ---------- quà: mỗi lần hiện 1 băng rôn, người khác xếp hàng (quà KHÔNG cho lợi thế trong game) ----------
  private quaCho: Qua[] = [];
  private nhacDa = false; // đã nhắc giữa giờ ở câu này chưa
  private khach: { id: string; name: string }[] = []; // người bình luận gần đây nhất

  /** Tên cho đám trẻ chạy giữa sân: người đã thi mà hết ghế, rồi tới người vừa bình luận chưa có ghế */
  treCon(ghe: Hang[]) {
    const coGhe = new Set(ghe.map((h) => h.id));
    const ds: string[] = [];
    for (const h of this.bxh(GAME.soGhe + GAME.soTre, true).slice(GAME.soGhe)) ds.push(h.name);
    for (const k of this.khach) if (!coGhe.has(k.id) && !ds.includes(k.name)) ds.push(k.name);
    return ds.slice(0, GAME.soTre);
  }
  qua: (Qua & { den: number }) | null = null;

  /** Có người tặng quà. Cùng người tặng liên tục thì gộp vào băng rôn đang chờ. */
  tangQua(q: Omit<Qua, 'at'>, now: number) {
    const cu = this.qua?.id === q.id && this.qua.gift === q.gift ? this.qua : this.quaCho.find((x) => x.id === q.id && x.gift === q.gift);
    if (cu) {
      cu.count += q.count;
      cu.coins += q.coins;
      cu.big ||= q.big;
      return;
    }
    this.quaCho.push({ ...q, at: now });
    // quà to chen lên trước; hàng chờ có trần, quá thì bỏ quà nhỏ cũ nhất
    this.quaCho.sort((a, b) => Number(b.big) - Number(a.big));
    if (this.quaCho.length > 6) this.quaCho.pop(); // đã xếp quà to lên đầu nên cuối hàng là quà nhỏ mới nhất
    this.chayQua(now);
  }

  private chayQua(now: number) {
    if (this.qua && now < this.qua.den) return;
    const q = this.quaCho.shift();
    this.qua = q ? { ...q, at: now, den: now + (q.big ? GAME.quaToSec : GAME.quaSec) * 1000 } : null;
  }

  constructor(
    private bank: McQ[],
    /** id câu -> lúc hỏi gần nhất; game ưu tiên câu lâu chưa hỏi */
    public used: Record<string, number> = {},
    private rand: () => number = Math.random,
  ) {}

  /** Bắt đầu đếm ngược tới ván mới */
  cho(now: number) {
    this.phase = 'cho';
    this.endsAt = now + GAME.choSec * 1000;
    this.events.push({ t: 'cho' });
  }

  batDau(now: number) {
    this.trangTruoc = this.trangMoi;
    this.dauTruoc = null;
    this.dauBaoCau = -99;
    this.mienBaoCau = 0;
    this.siTu.clear();
    this.cauList = this.chonCau(now);
    this.idx = 0;
    this.moVong(now);
  }

  /** Lấy các sự kiện cần đọc từ lần gọi trước */
  lay(): Ev[] {
    return this.events.splice(0);
  }

  /** Số thứ tự câu đang hỏi (1-20); docText(cauSo) là đề câu kế tiếp */
  get cauSo() {
    return this.idx + 1;
  }

  get cau(): Cau | undefined {
    return this.cauList[this.idx];
  }

  private get vong(): Vong {
    return GAME.vong[this.cau?.vong ?? 0];
  }

  private chonCau(now: number): Cau[] {
    const taken = new Set<string>();
    const out: Cau[] = [];
    GAME.vong.forEach((v, vi) => {
      const ds: McQ[] = [];
      for (const [level, n] of v.phan) {
        // câu lâu chưa hỏi nhất trước, cùng mức thì ngẫu nhiên; nhóm thiếu câu thì lấy nhóm khác
        const lay = (cung: boolean) =>
          shuffle(this.bank.filter((q) => (cung ? q.level === level : true) && !taken.has(q.id)), this.rand)
            .sort((a, b) => (this.used[a.id] ?? 0) - (this.used[b.id] ?? 0));
        let pool = lay(true);
        if (pool.length < n) pool = [...pool, ...lay(false).filter((q) => !pool.includes(q))];
        for (const q of pool.slice(0, n)) {
          taken.add(q.id);
          this.used[q.id] = now;
          ds.push(q);
        }
      }
      shuffle(ds, this.rand);
      if (v.toan) ds.splice(Math.min(2, ds.length), 0, sinhToan(v.toan, this.rand)); // câu toán ở vị trí thứ 3
      for (const q of ds) {
        const opts = shuffle([q.right, ...q.wrong], this.rand);
        out.push({ q, opts, ans: opts.indexOf(q.right), vong: vi });
      }
    });
    return out;
  }

  private moVong(now: number) {
    this.phase = 'vong';
    this.endsAt = now + GAME.vongSec * 1000;
    this.events.push({ t: 'vong', vong: this.cau?.vong ?? 0 });
  }

  private moCau(now: number) {
    const c = this.cau!;
    this.phase = 'doc';
    this.endsAt = now + GAME.docMaxSec * 1000;
    this.answers.clear();
    this.counts = [0, 0, 0, 0];
    this.recent = [];
    this.ketQua = null;
    this.nhacDa = false;
    this.cuu = { tim: 0, xong: false, loai: [] };
    if (this.laLatKeo) this.events.push({ t: 'latKeo' });
    else if (this.idx > 0 && this.rand() < GAME.thachTiLe) this.events.push({ t: 'thach' });
    this.events.push({ t: 'doc', text: this.docText(this.idx)! });
  }

  /** Lời đọc đề câu thứ i (để tạo giọng sẵn trước khi tới câu đó) */
  docText(i: number) {
    const c = this.cauList[i];
    if (!c) return null;
    const opts = c.opts.map((o, k) => `${'ABCD'[k]}, ${o}.`).join(' ');
    return `Câu ${i + 1}. ${c.q.q} ${opts}`;
  }

  /** Câu cuối ván: điểm nhân đôi (cả cộng lẫn trừ) */
  get laLatKeo() {
    return this.cauList.length > 0 && this.idx === this.cauList.length - 1;
  }

  /** Cả phòng thả tim. Ở Thi Đình, đủ tim trong lúc đọc đề / trả lời thì loại 2 đáp án sai. */
  tim(n: number) {
    const c = this.cau;
    if (!c || c.vong !== GAME.vong.length - 1 || this.cuu.xong || (this.phase !== 'doc' && this.phase !== 'hoi')) return;
    this.cuu.tim += n;
    if (this.cuu.tim < GAME.cuuTroTim) return;
    this.cuu.xong = true;
    const sai = shuffle([0, 1, 2, 3].filter((i) => i !== c.ans), this.rand);
    this.cuu.loai = sai.slice(0, 2);
    this.events.push({ t: 'cuuTro' });
  }

  /** Lời công bố đáp án câu đang hỏi (tạo giọng sẵn trong lúc mọi người trả lời) */
  dapAnText() {
    const c = this.cau;
    return c ? `${'ABCD'[c.ans]}, ${c.opts[c.ans]}!` : '';
  }

  /** Giọng đọc xong đề: hiện 4 đáp án, bắt đầu tính giờ */
  docXong(now: number) {
    if (this.phase !== 'doc') return;
    this.phase = 'hoi';
    this.shownAt = now;
    this.endsAt = now + this.vong.giay * 1000;
  }

  /** Bỏ câu đang hỏi (câu lỗi): không ai được điểm, sang câu tiếp */
  boCau(now: number) {
    if (this.phase !== 'doc' && this.phase !== 'hoi') return;
    // câu viết tay bị bỏ: đẩy xuống cuối hàng mãi mãi (chỉ hỏi lại khi đã hết sạch câu khác)
    const id = this.cau?.q.id;
    if (id && !id.startsWith('toan:')) this.used[id] = Number.MAX_SAFE_INTEGER;
    this.answers.clear();
    this.sauDapAn(now);
  }

  /**
   * 1 bình luận. createTime = giờ TikTok gắn lúc người xem gửi.
   * Trả về true nếu được tính là bài nộp.
   */
  chat(e: { id: string; name: string; avatar: string; comment: string; createTime?: number }, now: number) {
    // ai bình luận cũng được nhớ tên (để chạy trên sân thành đám trẻ nếu chưa có ghế)
    this.khach = [{ id: e.id, name: e.name }, ...this.khach.filter((k) => k.id !== e.id)].slice(0, 12);
    if (e.createTime) {
      const d = now - e.createTime;
      this.skew = this.skewN ? Math.min(this.skew + 5, d) : d;
      this.skewN++;
    }
    const g = lenhGioi(e.comment);
    if (g) {
      this.gioiChon.set(e.id, g);
      return false;
    }
    const m = lenhMien(e.comment);
    if (m) {
      this.mienChon.set(e.id, m);
      return false;
    }
    if (this.phase !== 'hoi') return false;
    const chon = choiceOf(e.comment);
    if (chon === null || this.answers.has(e.id)) return false;
    const sentAt = e.createTime && this.skewN > 1 ? e.createTime + this.skew : now;
    if (sentAt < this.shownAt - GAME.earlySendGraceMs) return false; // gửi lúc đáp án chưa hiện: không tính, không mất lượt
    const total = this.vong.giay * 1000;
    this.answers.set(e.id, { chon, ms: Math.max(0, Math.min(total, sentAt - this.shownAt)) });
    this.counts[chon]++;
    const s = this.siTu.get(e.id);
    if (s) {
      s.name = e.name;
      s.avatar = e.avatar || s.avatar;
    } else {
      this.siTu.set(e.id, { id: e.id, name: e.name, avatar: e.avatar, diem: 0, chuoi: 0, msDung: 0, vaoLuc: now, gain: 0 });
    }
    this.recent = [e.name, ...this.recent.filter((n) => n !== e.name)].slice(0, 5);
    return true;
  }

  tick(now: number) {
    this.chayQua(now);
    // giữa giờ (câu từ 15 giây) ông đồ giục 1 câu, đỡ im lặng
    if (this.phase === 'hoi' && !this.nhacDa && this.vong.giay >= 15 && now >= this.shownAt + this.vong.giay * 500) {
      this.nhacDa = true;
      this.events.push({ t: 'nhac' });
    }
    if (now < this.endsAt) return;
    switch (this.phase) {
      case 'cho':
        return this.batDau(now);
      case 'vong':
        return this.moCau(now);
      case 'doc':
        return this.docXong(now);
      case 'hoi':
        // hết giờ: khoá bài, trống dồn hồi hộp rồi mới công bố (chưa chấm để bảng điểm không lộ đáp án)
        this.phase = 'chot';
        this.endsAt = now + GAME.chotSec * 1000;
        this.events.push({ t: 'chot' });
        return;
      case 'chot':
        return this.chamCau(now);
      case 'dapAn':
        return this.sauDapAn(now);
      case 'bangVang':
        return this.idx < this.cauList.length ? this.moVong(now) : this.moVinhQuy(now);
      case 'vinhQuy':
        return this.cho(now);
    }
  }

  private chamCau(now: number) {
    const c = this.cau!;
    const v = this.vong;
    const total = v.giay * 1000;
    const nhan = this.laLatKeo ? GAME.latKeoNhan : 1;
    let treuSai: SiTu | null = null;
    const nhanh: { name: string; ms: number; diem: number }[] = [];
    for (const s of this.siTu.values()) s.gain = 0;
    for (const s of this.siTu.values()) {
      const a = this.answers.get(s.id);
      if (!a) {
        s.chuoi = 0; // bỏ câu thì mất chuỗi
        continue;
      }
      if (a.chon === c.ans) {
        let p = diemDung(v.diem, a.ms, total) * nhan;
        s.chuoi++;
        if (s.chuoi % GAME.chuoiMoi === 0) p += GAME.chuoiThuong;
        s.diem += p;
        s.gain = p;
        s.msDung += a.ms;
        s.saiLien = 0;
        nhanh.push({ name: s.name, ms: a.ms, diem: p });
      } else {
        const tru = Math.min(s.diem, Math.round(v.diem * GAME.saiTru) * nhan);
        s.diem -= tru;
        s.gain = -tru;
        s.chuoi = 0;
        s.saiLien = (s.saiLien ?? 0) + 1;
        if (s.saiLien === 3 && !treuSai) treuSai = s;
      }
    }
    nhanh.sort((a, b) => a.ms - b.ms);
    this.ketQua = { soDung: nhanh.length, nhanh: nhanh.slice(0, 3) };
    if (treuSai) this.events.push({ t: 'saiLien', id: treuSai.id, name: treuSai.name });
    // đổi ngôi đầu bảng: hô tên người mới dẫn đầu (giãn cách vài câu cho đỡ lặp)
    const dau = this.bxh(1)[0];
    if (dau && dau.id !== this.dauTruoc) {
      if (this.dauTruoc && this.idx - this.dauBaoCau >= GAME.dauBangCach) {
        this.events.push({ t: 'dauBang', name: dau.name });
        this.dauBaoCau = this.idx;
      }
      this.dauTruoc = dau.id;
    }
    // phe miền đang thua (có người chơi, kém xa miền dẫn đầu): cổ vũ 5 câu 1 lần
    if (this.idx - this.mienBaoCau >= GAME.mienCach) {
      const ds = (Object.entries(this.diemMien()) as [Mien, { diem: number; nguoi: number }][]).filter(([, x]) => x.nguoi > 0);
      if (ds.length >= 2) {
        ds.sort((a, b) => a[1].diem - b[1].diem);
        if (ds[ds.length - 1][1].diem > ds[0][1].diem * 1.5) {
          this.events.push({ t: 'mienKem', mien: ds[0][0] });
          this.mienBaoCau = this.idx;
        }
      }
    }
    this.phase = 'dapAn';
    this.endsAt = now + GAME.dapAnSec * 1000;
    this.events.push({
      t: 'dapAn', chu: 'ABCD'[c.ans], dap: c.opts[c.ans], soDung: nhanh.length, soNop: this.answers.size,
      nhanh: nhanh[0]?.name, msNhanh: nhanh[0]?.ms,
    });
  }

  private sauDapAn(now: number) {
    const vongCu = this.cau?.vong ?? 0;
    this.idx++;
    if (this.idx < this.cauList.length && this.cau!.vong === vongCu) return this.moCau(now);
    this.phase = 'bangVang';
    this.endsAt = now + GAME.bangVangSec * 1000;
    this.events.push({ t: 'bangVang', vong: GAME.vong[vongCu].ten, dau: this.bxh(1)[0]?.name });
  }

  private moVinhQuy(now: number) {
    this.phase = 'vinhQuy';
    this.endsAt = now + GAME.vinhQuySec * 1000;
    const top = this.bxh(3);
    this.trangMoi = top[0]?.id ?? null;
    const mien = (Object.entries(this.diemMien()) as [Mien, { diem: number; nguoi: number }][])
      .filter(([, x]) => x.diem > 0)
      .sort((a, b) => b[1].diem - a[1].diem)[0];
    this.events.push({ t: 'vinhQuy', top: top.map((h) => h.name), mien: mien && { mien: mien[0], diem: mien[1].diem } });
  }

  /** Bảng vàng: điểm cao trước; bằng điểm thì tổng thời gian đúng ngắn hơn, rồi ai vào trước */
  bxh(n = 20, caNguoiChuaDiem = false): Hang[] {
    return [...this.siTu.values()]
      .filter((s) => caNguoiChuaDiem || s.diem > 0 || s.gain !== 0)
      .sort((a, b) => b.diem - a.diem || a.msDung - b.msDung || a.vaoLuc - b.vaoLuc)
      .slice(0, n)
      .map((s, i) => ({ hang: i + 1, id: s.id, name: s.name, avatar: s.avatar, diem: s.diem, danhHieu: GAME.danhHieu(i + 1), gain: s.gain, gioi: this.gioiCua(s),
        mien: this.mienChon.get(s.id), chuoi: s.chuoi, trangTruoc: s.id === this.trangTruoc, dauTuan: !!s.id && this.tuan[0]?.id === s.id }));
  }

  /** Tổng điểm ván này của từng phe miền */
  diemMien() {
    const kq = { bac: { diem: 0, nguoi: 0 }, trung: { diem: 0, nguoi: 0 }, nam: { diem: 0, nguoi: 0 } };
    for (const [id, m] of this.mienChon) {
      kq[m].nguoi++;
      kq[m].diem += this.siTu.get(id)?.diem ?? 0;
    }
    return kq;
  }

  /** Nam / nữ: người chơi tự chọn > đoán theo tên > cố định theo tài khoản */
  gioiCua(s: { id: string; name: string }): Gioi {
    return this.gioiChon.get(s.id) ?? doanGioi(s.name) ?? ([...s.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 2 ? 'nu' : 'nam');
  }

  /** Ảnh chụp cho màn hình (gửi cả sang trang điều khiển) */
  view(now: number) {
    const c = this.cau;
    const v = c ? GAME.vong[c.vong] : GAME.vong[0];
    const lo = this.phase === 'dapAn';
    return {
      phase: this.phase,
      vong: c?.vong ?? 0,
      vongTen: v.ten,
      vongNhan: v.nhan,
      vongInfo: { cau: v.cau, giay: v.giay, diem: v.diem, tru: Math.round(v.diem * GAME.saiTru) },
      cauSo: this.idx + 1,
      tongCau: this.cauList.length || GAME.vong.reduce((n, x) => n + x.cau, 0),
      q: c?.q.q ?? '',
      opts: this.phase === 'hoi' || this.phase === 'chot' || lo ? c?.opts ?? [] : [],
      con: Math.max(0, Math.ceil((this.endsAt - now) / 1000)),
      tongGiay: v.giay,
      soNop: this.answers.size,
      counts: lo ? this.counts : null,
      dung: lo ? c?.ans ?? -1 : -1,
      ketQua: lo ? this.ketQua : null,
      recent: this.recent,
      soSiTu: this.siTu.size,
      qua: this.qua && { id: this.qua.id, name: this.qua.name, avatar: this.qua.avatar, gift: this.qua.gift, count: this.qua.count, big: this.qua.big, at: this.qua.at },
      tuan: this.tuan,
      mien: this.diemMien(),
      latKeo: this.laLatKeo && ['doc', 'hoi', 'chot', 'dapAn'].includes(this.phase),
      cuu: c && c.vong === GAME.vong.length - 1 && ['doc', 'hoi', 'chot', 'dapAn'].includes(this.phase)
        ? { tim: Math.min(this.cuu.tim, GAME.cuuTroTim), can: GAME.cuuTroTim, loai: this.cuu.loai }
        : null,
      // chỗ ngồi trong sân thi: ai đã nộp bài đều được ngồi (kể cả 0 điểm), điểm cao ngồi chỗ đẹp
      ghe: this.bxh(GAME.soGhe, true),
      treCon: this.treCon(this.bxh(GAME.soGhe, true)),
      top: this.bxh(this.phase === 'bangVang' || this.phase === 'vinhQuy' ? 20 : 10),
      // bản quét QR: điểm của từng người cho điện thoại [điểm, hạng, điểm câu vừa rồi, đáp án đã chọn câu này hoặc -1]
      ban: Object.fromEntries(
        this.bxh(this.siTu.size, true).map((h) => [h.id, [h.diem, h.hang, h.gain, this.answers.get(h.id)?.chon ?? -1]]),
      ) as Record<string, [number, number, number, number]>,
    };
  }
}

export type View = ReturnType<KyThi['view']>;

export interface Qua {
  id: string;
  name: string;
  avatar: string;
  gift: string;
  count: number;
  coins: number;
  big: boolean;
  at: number;
}
