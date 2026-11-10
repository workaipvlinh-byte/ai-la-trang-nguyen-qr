import { AnimatePresence, motion } from 'motion/react';
import type { GameState } from './useGame';
import type { Hang, View } from './thi';
import { GAME } from './config';

/**
 * Màn hình live 1080x1920: sân thi đầu làng, vẽ đè lên ảnh nền public/assets/bg/nen2.jpg
 * (cắt từ nen-ver2.png, phóng 1,12 lần cho rộng rãi). Toạ độ đo trên nen2.jpg:
 *   bảng đen x 220-860, y 522-830 · mái tranh y 350-490 · tán đa y 0-350 · sân trống trước bảng y 850-960
 *   các dãy bàn y 1000-1660 (toạ độ từng bàn ở HANG) · lối đi giữa x 455-640 · nhà tranh, hàng rào bên phải x 900+
 * Chừa 250px dưới cùng và mép phải cho giao diện TikTok.
 */
const GOLD = '#d9a441';
const CREAM = '#fff1cc';
const PHAN = '#f5f1e6'; // màu chữ phấn trên bảng đen
const PANEL = 'rgba(38,18,8,.80)';

export function GameStage({ game }: { game: GameState }) {
  const v = game.view;
  if (!v) return <div className="absolute inset-0" />;
  const bigBoard = v.phase === 'bangVang' || v.phase === 'vinhQuy';
  return (
    <div className="absolute inset-0 select-none" style={{ color: CREAM }}>
      <CayDa />
      <DanLang />
      <SanThi v={v} />
      <TreCon ten={v.treCon} />

      {!bigBoard && <DongCau v={v} tieuDe={game.caiDat.tieuDe} />}
      {!bigBoard && <BangDen v={v} />}
      {!bigBoard && <DapAn v={v} />}
      {!bigBoard && (v.cuu && !v.ketQua ? <CuuTro v={v} /> : <DongNhac v={v} />)}
      {!bigBoard && <BangNho v={v} />}

      <MC v={v} ten={game.caiDat.tenOngDo} />

      {/* Màn bảng lớn: tờ giấy dó phủ giữa sân, nằm trên sĩ tử (zIndex 1000-1600) và dưới băng rôn quà */}
      {bigBoard && (
        <div className="absolute inset-0" style={{ zIndex: 2000 }}>
          <div className="absolute overflow-hidden rounded-[14px] border-4" style={{ left: 60, top: 120, width: 960, height: 1340, borderColor: GOLD, background: 'radial-gradient(ellipse at 50% 40%,#fbf0d6 0%,#f3e2bb 75%,#ead39f 100%)' }} />
          <BangVang v={v} />
        </div>
      )}

      {(v.phase === 'vinhQuy' || v.qua?.big) && <PhaoGiay />}
      <BangQua v={v} />
    </div>
  );
}

// ---------------- sân thi: sĩ tử ngồi bàn, có tên trên đầu ----------------

/**
 * Chỗ ngồi [x giữa bàn, y mép trên mặt bàn, bề rộng bàn], đo trên nen2.jpg.
 * Xếp theo thứ tự ưu tiên: điểm cao ngồi các hàng giữa (to, rõ, không bị TikTok che) trước,
 * rồi tới hàng gần khán giả và hàng sát bảng.
 * và các bàn mép phải (x > 950) vì nút TikTok che.
 */
const HANG: [number, number, number[]][] = [
  // [y mặt bàn, bề rộng bàn, các x giữa bàn]
  // dùng cách một hàng bàn: các hàng trong ảnh sát nhau, xếp liền thì bảng tên hàng trước che mặt hàng sau
  [1418, 135, [380, 762, 217, 55, 945]],
  [1293, 110, [395, 714, 253, 866, 105]],
  [1575, 165, [369, 838, 159]],
  [1195, 100, [401, 691, 276, 820, 154, 947]],
  // các hàng sát bảng đen: bàn nhỏ, sĩ tử nhỏ theo phối cảnh; ngồi sau cùng khi các hàng trên đã đủ
  [1118, 88, [405, 672, 290, 790, 180, 905]],
  [1055, 80, [410, 655, 305, 760, 205, 865]],
];
const GHE = HANG.flatMap(([y, w, xs]) => xs.map((x) => ({ x, y, w }))).slice(0, GAME.soGhe);

/** Băm tên tài khoản ra số cố định (để mỗi người luôn quay cùng một hướng) */
const bam = (id: string) => [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

function SanThi({ v }: { v: View }) {
  const lo = v.phase === 'dapAn';
  // vẽ hàng xa (y nhỏ) trước để hàng gần đè lên
  const ds = v.ghe.map((h, i) => ({ h, g: GHE[i] })).filter((x) => x.g).sort((a, b) => a.g.y - b.g.y);
  return (
    <>
      {ds.map(({ h, g }) => (
        <SiTu key={h.id} h={h} x={g.x} y={g.y} w={g.w} lo={lo} />
      ))}
    </>
  );
}

function SiTu({ h, x, y, w, lo }: { h: Hang; x: number; y: number; w: number; lo: boolean }) {
  const full = w * 1.65; // chiều cao cả người
  const hien = full * 0.56; // chỉ lộ nửa người trên khỏi mặt bàn
  const rong = full * 0.46; // ảnh vật lưng rộng ~0,46 chiều cao
  const lat = bam(h.id) % 2 === 1;
  const top3 = h.hang <= 3 && h.diem > 0;
  // chữ tên tự thu nhỏ cho vừa bảng tên (rộng tối đa w*1.25); tên quá dài thì nhỏ tới 11px rồi mới cắt bớt
  const goc = Math.max(16, Math.round(w * 0.18));
  const soChu = [...h.name].length + (top3 ? 2 : 0) + (h.chuoi >= 3 ? 2 : 0);
  const chu = Math.max(11, Math.min(goc, Math.floor((w * 1.25 - 16) / (soChu * 0.58))));
  const nhay = lo && h.gain > 0;
  return (
    <motion.div
      className="absolute"
      style={{ left: x - rong / 2, top: y - hien + w * 0.06, width: rong, zIndex: Math.round(y) }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: nhay ? [0, -w * 0.18, 0] : 0 }}
      transition={nhay ? { duration: 0.5, repeat: 2 } : { duration: 0.35 }}
    >
      {/* bảng tên trên đầu */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full px-2 font-bold" style={{
        bottom: hien + 2, fontSize: chu, lineHeight: 1.25, maxWidth: w * 1.25,
        background: top3 ? 'linear-gradient(#ffd34d,#e8a33d)' : 'rgba(30,14,6,.82)', color: top3 ? '#4a1a0c' : CREAM,
        border: `2px solid ${top3 ? '#fff3c4' : 'rgba(217,164,65,.7)'}`,
      }}>
        {top3 && <span>{['👑', '🥈', '🥉'][h.hang - 1]}</span>}
        <span className="truncate">{h.name}</span>
        {h.chuoi >= 3 && <span className="shrink-0">🔥</span>}
      </div>
      {/* điểm cộng / trừ bay lên lúc công bố */}
      <AnimatePresence>
        {lo && h.gain !== 0 && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-extrabold"
            style={{ bottom: hien + chu * 1.6, fontSize: chu * 1.1, color: h.gain > 0 ? '#7dff9a' : '#ff8a80', textShadow: '0 2px 4px #000' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -6 }}
            exit={{ opacity: 0 }}
          >
            {h.gain > 0 ? `+${h.gain}` : h.gain}
          </motion.div>
        )}
      </AnimatePresence>
      {/* quay lưng ra khán giả, mặt hướng lên bảng đen; chỉ lộ nửa người trên khỏi mặt bàn */}
      <div className="overflow-hidden" style={{ height: hien }}>
        <img src={`/assets/nv/lang/lung-${h.gioi === 'nu' ? 'nu' : 'nam'}.webp`} draggable={false} className="mx-auto block max-w-none"
          style={{ height: full, transform: lat ? 'scaleX(-1)' : undefined, filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.35))' }} />
      </div>
    </motion.div>
  );
}

/** Đám trẻ nghịch ngợm chạy quanh sân (chỉ dùng transform cho nhẹ máy) */
// mỗi đứa chạy một nhịp riêng (thời gian, độ lệch, chỗ xuất phát) cho thành một đám lộn xộn tự nhiên
const DAM_TRE = [
  { left: 470, dur: 13, delay: 0, nu: false },
  { left: 530, dur: 15.5, delay: -5, nu: true },
  { left: 500, dur: 11.5, delay: -8, nu: false },
  { left: 560, dur: 14, delay: -2.5, nu: true },
  { left: 485, dur: 16.5, delay: -11, nu: true },
  { left: 545, dur: 12.5, delay: -6.5, nu: false },
];
function TreCon({ ten }: { ten: string[] }) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1500 }}>
      {DAM_TRE.map((t, i) => (
        <div key={i} className="tre-chay absolute" style={{ left: t.left, top: 880, animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}>
          {ten[i] && (
            <div className="absolute bottom-full left-1/2 mb-1 max-w-[150px] -translate-x-1/2 truncate whitespace-nowrap rounded-full border-2 px-2 text-[17px] font-bold leading-[24px]" style={{ background: 'rgba(30,14,6,.82)', borderColor: 'rgba(217,164,65,.7)', color: CREAM }}>
              {ten[i]}
            </div>
          )}
          <div className="tre-lat" style={{ animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}>
            <img className="tre-nhun" src={`/assets/nv/lang/${t.nu ? 'tre-nu' : 'tre-nam'}.webp`} style={{ height: t.nu ? 118 : 128, animationDelay: `${i * -0.13}s` }} draggable={false} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Tán đa rung nhẹ theo gió: một lớp cắt đúng phần tán lá của chính ảnh nền, lắc rất nhẹ, mép dưới mờ dần
 * để không lộ đường cắt. Thêm vài chiếc lá đa rơi lác đác (chỉ dùng transform cho nhẹ máy).
 */
const LA = Array.from({ length: 9 }, (_, i) => ({
  left: 40 + ((i * 113) % 1000),
  delay: i * 1.7,
  dur: 11 + (i % 4) * 2.5,
  size: 20 + (i % 3) * 7,
  mau: ['#6f8f2f', '#9aa83a', '#c9a23a', '#7c6a2b'][i % 4],
}));
function CayDa() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="cay-rung absolute left-0 top-0" style={{ width: 1080, height: 380, backgroundImage: "url('/assets/bg/nen2.jpg')", backgroundSize: '1080px 1920px', backgroundPosition: 'top left', WebkitMaskImage: 'linear-gradient(#000 70%, transparent)', maskImage: 'linear-gradient(#000 70%, transparent)' }} />
      {LA.map((l, i) => (
        <svg key={i} className="la-roi absolute" viewBox="0 0 20 30" style={{ left: l.left, top: -40, width: l.size, height: l.size * 1.5, animationDelay: `${l.delay}s`, animationDuration: `${l.dur}s` }}>
          <path d="M10 1 C17 8 18 20 10 29 C2 20 3 8 10 1 Z" fill={l.mau} />
          <path d="M10 3 L10 27" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
        </svg>
      ))}
    </div>
  );
}

/** Già làng và các cụ ngồi xem ở sân trống bên phải, cạnh cột bảng đen */
function DanLang() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ong-quat.webp" style={{ left: 958, top: 872, height: 140 }} draggable={false} />
      <img className="cu-ngoi absolute" src="/assets/nv/lang/gia-lang.webp" style={{ left: 870, top: 862, height: 158, animationDelay: '1.3s' }} draggable={false} />
      {/* thêm các cụ đứng xem dọc mép sân, hai bên dãy bàn */}
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ba-non.webp" style={{ left: 985, top: 1010, height: 130, animationDelay: '0.6s' }} draggable={false} />
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ba-cuoc.webp" style={{ left: 990, top: 1140, height: 150, animationDelay: '2s' }} draggable={false} />
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ong-gay.webp" style={{ left: 6, top: 930, height: 140, animationDelay: '0.9s' }} draggable={false} />
      <img className="cu-ngoi absolute" src="/assets/nv/lang/ba-om-goi.webp" style={{ left: 0, top: 1080, height: 140, animationDelay: '1.7s' }} draggable={false} />
    </div>
  );
}

// ---------------- bảng đen, mái tranh ----------------

/** Trên mái tranh: "CÂU 12/20" + tiến độ 4 kỳ, tên kỳ thi, đồng hồ */
function DongCau({ v, tieuDe }: { v: View; tieuDe: string }) {
  const showTimer = v.phase === 'hoi';
  const low = showTimer && v.con <= 5;
  const plank = { background: PANEL, borderColor: GOLD };
  return (
    <>
      <div className="absolute flex flex-col items-center justify-center gap-1 rounded-[14px] border-[3px] px-3" style={{ ...plank, left: 150, top: 362, width: 210, height: 78 }}>
        <span className="text-[28px] font-extrabold leading-none">{v.phase === 'cho' ? 'ĐỢI VÁN MỚI' : `CÂU ${Math.min(v.cauSo, v.tongCau)}/${v.tongCau}`}</span>
        <span className="flex gap-1.5">
          {GAME.vong.map((_, i) => (
            <span key={i} className="h-4 w-7 rounded-full" style={{ background: v.phase === 'cho' ? '#6b5236' : i < v.vong ? '#c8102e' : i === v.vong ? GOLD : '#6b5236' }} />
          ))}
        </span>
      </div>
      <div
        className={`absolute flex items-center justify-center whitespace-nowrap rounded-[14px] border-[3px] px-3 ${v.vongNhan.length > 9 ? 'text-[21px]' : 'text-[26px]'} font-extrabold`}
        style={{
          left: 222, top: 866, width: 200, height: 48, borderColor: GOLD,
          background: v.latKeo ? 'linear-gradient(#e8a33d,#b8741c)' : 'linear-gradient(#7a2414,#561409)',
          color: v.latKeo ? '#4a1a0c' : '#ffd977',
          boxShadow: v.latKeo ? '0 0 30px rgba(255,211,77,.9)' : undefined,
        }}
      >
        {v.phase === 'cho' ? 'SẮP THI' : v.latKeo ? 'NƯỚC RÚT ×2' : v.vongNhan}
      </div>
      {/* tên game treo giữa mái tranh */}
      <div className="absolute flex items-center justify-center gap-3 whitespace-nowrap rounded-[18px] px-3 text-center font-extrabold" style={{
        left: 372, top: 352, width: 540, height: 96, fontSize: Math.max(22, Math.min(42, Math.floor(410 / ([...tieuDe].length * (tieuDe === tieuDe.toUpperCase() ? 0.74 : 0.6))))), // tự co cho vừa khung (chữ in hoa rộng hơn)
        border: `4px double ${GOLD}`, outline: '2px solid #3a0d05',
        background: 'linear-gradient(#8a2a14,#4f1309)', color: '#ffd977', textShadow: '0 3px 0 #3a0d05, 0 0 16px rgba(255,211,77,.55)',
        boxShadow: '0 8px 22px rgba(0,0,0,.5), inset 0 0 18px rgba(255,200,90,.25)',
      }}>
        <span className="text-[34px]">🏮</span>
        <span className="truncate py-2" style={{ lineHeight: 1.45 }}>{tieuDe}</span>
        <span className="text-[34px]">🏮</span>
      </div>
      {showTimer && (
        <motion.div
          key={low ? `${v.cauSo}-${v.con}` : v.cauSo}
          initial={low ? { scale: 1.35 } : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={low ? { type: 'spring', stiffness: 500, damping: 14 } : undefined}
          className="absolute flex items-center justify-center rounded-full border-[5px] text-[46px] font-extrabold"
          style={{ left: 762, top: 530, width: 92, height: 92, zIndex: 25, borderColor: GOLD, background: low ? '#b3200c' : '#5a1409', color: '#ffe9a8', boxShadow: '0 6px 18px rgba(0,0,0,.45)' }}
        >
          {v.con}
        </motion.div>
      )}
      {/* Hết giờ: dấu đỏ đóng trên mái tranh, không che câu hỏi và 4 đáp án */}
      <AnimatePresence>
        {v.phase === 'chot' && (
          <motion.div
            key={`chot-${v.cauSo}`}
            initial={{ scale: 2.6, rotate: -14, opacity: 0 }}
            animate={{ scale: 1, rotate: -6, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 520, damping: 16 }}
            className="absolute flex items-center justify-center rounded-[16px] border-[7px] text-[60px] font-extrabold tracking-wider"
            style={{ left: 330, top: 352, width: 420, height: 104, zIndex: 20, borderColor: '#c8102e', color: '#c8102e', background: 'rgba(255,243,214,.95)', boxShadow: '0 8px 30px rgba(0,0,0,.45)' }}
          >
            HẾT GIỜ!
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Chữ phấn trên bảng đen: câu hỏi (hoặc màn chờ / giới thiệu kỳ thi) */
function BangDen({ v }: { v: View }) {
  const phan = { color: PHAN, textShadow: '0 0 2px rgba(255,255,255,.35)' };
  const full = { left: 230, top: 530, width: 620, height: 296 };
  if (v.phase === 'cho') {
    return (
      <div className="absolute flex flex-col items-center justify-center text-center" style={{ ...full, ...phan }}>
        <div className="text-[48px] font-extrabold" style={{ color: '#ffe27a' }}>Ván mới sau {v.con} giây</div>
        <div className="mt-4 space-y-1 text-[29px] font-semibold leading-snug">
          <div>4 kỳ thi · 20 câu · bấm trên điện thoại</div>
          <div>Quét mã QR, chọn đội Đỏ, Vàng hoặc Xanh</div>
          <div>Đúng càng nhanh điểm càng cao, sai bị trừ</div>
        </div>
      </div>
    );
  }
  if (v.phase === 'vong') {
    const i = v.vongInfo;
    return (
      <motion.div
        key={v.vongTen}
        initial={{ scale: 2.2, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ ...full, ...phan }}
      >
        <div className="text-[28px] font-bold opacity-80">Kỳ thi {v.vong + 1} / 4</div>
        <div className="text-[70px] font-extrabold leading-tight" style={{ color: '#ffe27a' }}>{v.vongTen}</div>
        <div className="mt-2 text-[30px] font-semibold">{i.cau} câu · {i.giay} giây mỗi câu</div>
        <div className="text-[30px] font-semibold">
          Đúng tới <b style={{ color: '#9dffb3' }}>+{i.diem}</b> · Sai <b style={{ color: '#ff8a80' }}>−{i.tru}</b>
        </div>
      </motion.div>
    );
  }
  return (
    <div className="absolute flex flex-col items-center justify-center px-3 text-center" style={{ left: 232, top: 532, width: 524, height: 162, ...phan }}>
      <div className={`${v.q.length > 90 ? 'text-[30px]' : v.q.length > 55 ? 'text-[35px]' : 'text-[41px]'} font-extrabold leading-snug`}>{v.q}</div>
      {v.phase === 'doc' && <div className="mt-2 text-[24px] font-semibold opacity-75">Nghe ông đồ đọc đề…</div>}
    </div>
  );
}

/** 4 ô đáp án viết phấn trên bảng. Đang hỏi không hiện tỉ lệ (tránh người vào sau chép theo số đông). */
function DapAn({ v }: { v: View }) {
  if (v.phase === 'cho' || v.phase === 'vong') return null;
  const total = v.counts ? v.counts.reduce((a, b) => a + b, 0) : 0;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const text = v.opts[i];
        const right = v.dung === i;
        const loai = !!v.cuu?.loai.includes(i);
        const dim = (v.dung >= 0 && !right) || loai;
        const pct = v.counts && total ? Math.round((v.counts[i] / total) * 100) : 0;
        return (
          <motion.div
            key={`${v.cauSo}-${i}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: text ? (dim ? 0.45 : 1) : 0.3, y: 0, scale: right ? 1.04 : 1, x: dim ? [0, -8, 8, -5, 5, 0] : 0 }}
            transition={{ delay: text && v.phase === 'hoi' ? i * 0.08 : 0, x: { duration: 0.45, delay: 0.5 } }}
            className="absolute flex flex-col justify-center rounded-[12px] border-[3px] px-3"
            style={{
              left: i % 2 ? 546 : 234, top: i < 2 ? 700 : 762, width: 300, height: 56,
              borderStyle: right ? 'solid' : 'dashed',
              borderColor: right ? '#9dffb3' : 'rgba(245,241,230,.55)',
              background: right ? 'rgba(60,170,90,.42)' : 'rgba(255,255,255,.05)',
              color: PHAN,
              boxShadow: right ? '0 0 22px rgba(157,255,179,.65)' : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[30px] font-extrabold" style={{ color: '#ffe27a' }}>{'ABCD'[i]}.</span>
              <span className={`${(text?.length ?? 0) > 16 ? 'text-[22px]' : 'text-[27px]'} truncate font-bold ${loai ? 'line-through opacity-50' : ''}`}>{text ?? '…'}</span>
              {loai && <span className="ml-auto text-[24px]">✂️</span>}
              {v.counts && <span className="ml-auto shrink-0 text-[20px] font-bold opacity-90">{pct}%</span>}
            </div>
            {v.counts && (
              <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
                <motion.div className="h-full rounded-full" style={{ background: right ? '#9dffb3' : '#ff8a80' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 1.6 }} />
              </div>
            )}
            {/* ô đúng nhấp nháy 4 lần lúc công bố rồi mới sáng xanh hẳn */}
            {right && <div className="nhap-nhay pointer-events-none absolute -inset-[3px] rounded-[12px]" />}
          </motion.div>
        );
      })}
    </>
  );
}

/** Dải dưới chân bảng đen: cách chơi, số người đã nộp, tên vừa nộp */
function DongNhac({ v }: { v: View }) {
  const kq = v.ketQua;
  const noi = kq
    ? kq.soDung > 0 ? `✅ ${kq.soDung} người đúng · nhanh nhất ${kq.nhanh[0].name} ${(kq.nhanh[0].ms / 1000).toFixed(2).replace('.', ',')}s` : '😮 Chưa ai đúng câu này'
    : v.phase === 'hoi'
    ? `📜 ${v.recent.length ? `${v.recent.slice(0, 3).join(', ')} vừa nộp · ` : ''}${v.soNop} sĩ tử đã nộp`
    : '📱 Quét mã QR bên cạnh để vào thi';
  return (
    <div className="absolute flex items-center justify-center" style={{ left: 432, top: 868, width: 430, height: 46, zIndex: 1700 }}>
      <div className="max-w-full truncate rounded-full border-2 px-4 text-[21px] font-bold leading-[40px]" style={{ background: PANEL, borderColor: GOLD }}>{noi}</div>
    </div>
  );
}

/** Thi Đình: cả phòng thả tim, đủ thì ông đồ loại 2 đáp án sai */
function CuuTro({ v }: { v: View }) {
  const c = v.cuu!;
  const xong = c.loai.length > 0;
  return (
    <div className="absolute flex items-center gap-3 rounded-full border-2 px-5" style={{ left: 432, top: 868, width: 428, height: 46, zIndex: 1700, background: PANEL, borderColor: GOLD }}>
      <span className="shrink-0 text-[22px] font-bold">{xong ? '✂️ Đã loại 2 câu sai!' : '❤️ Thả tim cứu trợ'}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-black/40">
        <motion.div className="h-full rounded-full" style={{ background: xong ? 'linear-gradient(90deg,#2f7d3a,#7dff9a)' : 'linear-gradient(90deg,#c8102e,#ff6f91)' }} animate={{ width: `${(c.tim / c.can) * 100}%` }} />
      </div>
      {!xong && <span className="shrink-0 text-[22px] font-bold tabular-nums">{c.tim}/{c.can}</span>}
    </div>
  );
}

// ---------------- bảng vàng, quà, vinh quy ----------------

/** Pháo giấy đỏ vàng rơi lúc vinh quy (40 mảnh, chỉ dùng transform cho nhẹ máy) */
const MANH = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 137) % 1080,
  delay: (i % 10) * 0.35,
  dur: 3.2 + ((i * 7) % 10) / 5,
  w: 14 + (i % 3) * 6,
  color: ['#c8102e', '#ffd34d', '#e8a33d', '#ff5a3c'][i % 4],
}));
function PhaoGiay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 3000 }}>
      {MANH.map((m, i) => (
        <div key={i} className="phao-giay absolute top-0" style={{ left: m.left, width: m.w, height: m.w * 0.6, background: m.color, animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s` }} />
      ))}
    </div>
  );
}

const crown = (h: number) => (h === 1 ? '👑' : h === 2 ? '🥈' : h === 3 ? '🥉' : `${h}.`);

const MIEN = {
  // bản quét QR: 3 phe là 3 đội màu (người chơi chọn trên điện thoại)
  bac: { chu: 'Đ', ten: 'Đỏ', mau: '#e53935' },
  trung: { chu: 'V', ten: 'Vàng', mau: '#e0a019' },
  nam: { chu: 'X', ten: 'Xanh', mau: '#2e9e4f' },
} as const;

/** Dấu cạnh tên: 🏆 đầu bảng tuần · 🎓 Trạng Nguyên ván trước · 🔥N đúng liền · chấm màu phe miền */
function DauHieu({ h }: { h: Hang }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-[22px]">
      {h.dauTuan && <span>🏆</span>}
      {h.trangTruoc && <span>🎓</span>}
      {h.chuoi >= 3 && <span className="font-extrabold text-[#ff6b4a]">🔥{h.chuoi}</span>}
      {h.mien && (
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-[17px] font-extrabold text-white" style={{ background: MIEN[h.mien].mau }}>
          {MIEN[h.mien].chu}
        </span>
      )}
    </span>
  );
}

/** Điểm 3 miền ván này, gọn trên 1 dòng */
function DiemMien({ v, big }: { v: View; big?: boolean }) {
  const ds = (Object.keys(MIEN) as (keyof typeof MIEN)[]).map((k) => ({ k, ...v.mien[k] }));
  if (!ds.some((x) => x.nguoi)) return null;
  const max = Math.max(...ds.map((x) => x.diem));
  return (
    <span className={`flex items-center gap-3 ${big ? 'text-[30px]' : 'text-[22px]'} font-bold`}>
      {ds.map((x) => (
        <span key={x.k} className="flex items-center gap-1" style={{ color: MIEN[x.k].mau }}>
          {x.diem === max && max > 0 && '👑'}
          {MIEN[x.k].ten} {x.diem.toLocaleString('vi-VN')}
        </span>
      ))}
    </span>
  );
}

/** 1 dòng bảng vàng. sang = nền giấy sáng (bảng lớn), mặc định nền gỗ tối */
function Dong({ h, big, sang }: { h: Hang; big?: boolean; sang?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${big ? 'text-[29px]' : 'text-[26px]'} font-bold leading-[1.25]`}>
      <span className="w-11 shrink-0 text-center">{crown(h.hang)}</span>
      <span className="min-w-0 flex-1 truncate">{h.name}</span>
      <DauHieu h={h} />
      <AnimatePresence>
        {h.gain !== 0 && (
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 text-[22px] font-extrabold" style={{ color: h.gain > 0 ? (sang ? '#1e6b2a' : '#7dff9a') : sang ? '#b3200c' : '#ff8a80' }}>
            {h.gain > 0 ? `+${h.gain}` : h.gain}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="w-[86px] shrink-0 text-right tabular-nums">{h.diem}</span>
    </div>
  );
}

/** Bảng vàng nhỏ treo dưới tán đa: top 5 lúc hỏi, top 10 (2 cột) lúc công bố; lúc chờ ván thì bảng vàng tuần */
function BangNho({ v }: { v: View }) {
  const box = { left: 90, top: 96, width: 900, height: 252, background: PANEL, borderColor: GOLD };
  if (v.phase === 'cho' && v.tuan.length) {
    return (
      <div className="absolute rounded-[18px] border-[3px] px-5 py-2" style={box}>
        <div className="flex items-baseline justify-between">
          <span className="text-[26px] font-extrabold text-[#ffd977]">🏆 BẢNG VÀNG TUẦN</span>
          <span className="text-[22px] font-semibold opacity-75">cộng điểm mọi ván</span>
        </div>
        <div className="grid grid-cols-2 gap-x-8">
          {v.tuan.slice(0, 10).map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[25px] font-bold leading-[1.25]">
              <span className="w-11 shrink-0 text-center">{crown(i + 1)}</span>
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              <span className="shrink-0 tabular-nums">{t.diem.toLocaleString('vi-VN')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const top = v.top.slice(0, 10);
  return (
    <div className="absolute rounded-[18px] border-[3px] px-5 py-2" style={box}>
      <div className="flex items-baseline justify-between">
        <span className="text-[26px] font-extrabold text-[#ffd977]">🏮 BẢNG VÀNG</span>
        {v.mien.bac.nguoi + v.mien.trung.nguoi + v.mien.nam.nguoi ? <DiemMien v={v} /> : <span className="text-[22px] font-semibold opacity-75">{v.soSiTu} sĩ tử</span>}
      </div>
      {top.length === 0 ? (
        <div className="mt-6 text-center text-[26px] font-semibold opacity-75">
          {v.soSiTu ? 'Chưa ai có điểm. Trả lời đúng để lên bảng!' : 'Chưa ai ghi danh. Quét mã QR để vào sân thi!'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-8">
          {top.map((h) => (
            <Dong key={h.id} h={h} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Băng rôn cảm ơn quà: trượt xuống trên cùng (không che câu hỏi) */
function BangQua({ v }: { v: View }) {
  const q = v.qua;
  return (
    <AnimatePresence>
      {q && (
        <motion.div
          key={q.at}
          initial={{ y: -260, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -260, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="absolute flex items-center gap-6 rounded-[28px] border-[5px] px-8"
          style={{
            left: 70, top: 110, width: 940, height: 220, zIndex: 3100, borderColor: GOLD,
            background: q.big ? 'linear-gradient(135deg,#ffd34d,#e8a33d 55%,#b8741c)' : 'linear-gradient(135deg,#8a1c0c,#5a1409)',
            color: q.big ? '#4a1a0c' : CREAM,
            boxShadow: q.big ? '0 0 50px rgba(255,211,77,.8)' : '0 10px 30px rgba(0,0,0,.45)',
          }}
        >
          <Avatar h={{ name: q.name, avatar: q.avatar }} size={150} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[54px] font-extrabold leading-tight">{q.name}</div>
            <div className="truncate text-[36px] font-bold">
              tặng {q.count > 1 ? `${q.count} × ` : ''}
              {q.gift} 🎁
            </div>
            <div className="text-[28px] font-semibold opacity-85">{q.big ? 'Ông đồ vái tạ ơn tấm lòng!' : 'Ông đồ cảm ơn nhé!'}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Bảng vàng lớn trên tờ giấy dó: hết mỗi kỳ thi (top 20) và vinh quy (tam khôi + bảng) */
function BangVang({ v }: { v: View }) {
  const vinh = v.phase === 'vinhQuy';
  const [tn, bn, th] = v.top;
  const rest = vinh ? v.top.slice(3, 11) : v.top;
  return (
    <div className="absolute" style={{ left: 100, top: 150, width: 880, height: 1280, color: '#4a1a0c' }}>
      <div className={`text-center ${vinh ? 'text-[42px] italic' : 'text-[46px]'} font-extrabold text-[#8a1c0c]`}>
        {vinh ? '“Hiền tài là nguyên khí của quốc gia”' : `BẢNG VÀNG SAU ${v.vongTen.toUpperCase()}`}
      </div>
      <div className="mt-1 flex justify-center">
        <DiemMien v={v} big />
      </div>
      {vinh && tn && (
        <div className="relative mt-2" style={{ height: 700 }}>
          {bn && <TamKhoi h={bn} left={20} top={170} imgH={400} delay={0.6} />}
          {th && <TamKhoi h={th} left={600} top={170} imgH={400} delay={1.1} />}
          <TamKhoi h={tn} left={270} top={0} imgH={540} delay={0.1} big />
        </div>
      )}
      {vinh && !tn && <div className="mt-24 text-center text-[36px] font-bold">Ván này chưa có sĩ tử nào</div>}
      <div className={`mt-5 grid grid-cols-2 gap-x-8 gap-y-1 ${vinh ? 'border-t-2 border-[#c9a46a] pt-4' : ''}`}>
        {rest.map((h, i) => (
          <motion.div key={h.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <Dong h={h} sang />
            <div className="pl-12 text-[20px] font-semibold opacity-70">{h.danhHieu}</div>
          </motion.div>
        ))}
      </div>
      {!vinh && v.top.length === 0 && <div className="mt-24 text-center text-[34px] font-bold">Chưa ai ghi danh</div>}
      {!vinh && v.phase === 'bangVang' && v.cauSo <= v.tongCau && (
        <div className="absolute inset-x-0 bottom-0 text-center text-[30px] font-bold opacity-80">Người mới vào vẫn kịp thi kỳ sau!</div>
      )}
    </div>
  );
}

/** Ảnh đại diện TikTok, viền vàng; không có ảnh thì hiện chữ cái đầu */
function Avatar({ h, size }: { h: { name: string; avatar: string }; size: number }) {
  const box = { width: size, height: size, borderColor: GOLD };
  return h.avatar ? (
    <img src={h.avatar} referrerPolicy="no-referrer" className="shrink-0 rounded-full border-[3px] object-cover" style={box} draggable={false} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full border-[3px] bg-[#8a1c0c] font-extrabold text-[#ffe9a8]" style={{ ...box, fontSize: size * 0.45 }}>
      {[...h.name][0]?.toUpperCase()}
    </span>
  );
}

/** 1 trong tam khôi: nhân vật cầm bảng + tên + điểm */
function TamKhoi({ h, left, top, imgH, delay, big }: { h: Hang; left: number; top: number; imgH: number; delay: number; big?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.45, delay }}
      className="absolute flex flex-col items-center"
      style={{ left, top, width: big ? 340 : 260 }}
    >
      <img src={`/assets/nv/top/top${h.hang}-${h.gioi}.webp`} style={{ height: imgH, filter: 'drop-shadow(0 10px 12px rgba(0,0,0,.35))' }} draggable={false} />
      <div className="mt-1 flex w-full items-center justify-center gap-2">
        <Avatar h={h} size={big ? 64 : 48} />
        <span className={`${big ? 'text-[40px]' : 'text-[30px]'} min-w-0 truncate font-extrabold text-[#8a1c0c]`}>{h.name}</span>
      </div>
      <div className={`${big ? 'text-[28px]' : 'text-[24px]'} font-bold`}>{h.diem} điểm</div>
    </motion.div>
  );
}

/** Ông đồ đứng cạnh bảng đen, bên trái trước gốc đa; đổi tư thế theo pha */
function MC({ v, ten }: { v: View; ten: string }) {
  const pose =
    v.phase === 'vinhQuy' ? 'mung'
    : v.phase === 'dapAn' ? (v.ketQua?.soDung ? 'mung' : 'tiec')
    : v.phase === 'hoi' ? 'suy-nghi'
    : v.phase === 'doc' || v.phase === 'bangVang' ? 'chi'
    : 'cuoi';
  return (
    <div className="pointer-events-none absolute" style={{ left: -24, top: 562, height: 360, zIndex: 1100 }}>
      {/* bảng tên ông đồ */}
      <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border-2 px-3 text-[22px] font-extrabold leading-[34px]" style={{ background: 'linear-gradient(#ffd34d,#e8a33d)', borderColor: '#fff3c4', color: '#4a1a0c', boxShadow: '0 3px 8px rgba(0,0,0,.4)' }}>
        🖌️ {ten}
      </div>
      <AnimatePresence mode="popLayout">
        <motion.img
          key={pose}
          src={`/assets/nv/mc/${pose}.webp`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ height: 360, filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.45))' }}
          draggable={false}
        />
      </AnimatePresence>
    </div>
  );
}
