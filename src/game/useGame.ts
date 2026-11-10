/// <reference types="vite/client" />
import { useEffect, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { containsBanned } from '../live/bannedWords';
import { NameBatcher } from '../live/scoreboard';
import { detectWish, GiftThanker, makePicker, OncePerPerson, RecentPeople, WishLimiter } from '../live/chatter';
import { IS_STAGE, MUTE } from '../live/page';
import { sfx } from './sfx';
import { GAME } from './config';
import { KyThi, parseMc, type Ev, type View } from './thi';
import { loaiCmt, Treu } from './treu';
// Mọi file câu hỏi trong src/game/cau-hoi/ (mỗi chủ đề 1 file)
const bankFiles = import.meta.glob<string>('./cau-hoi/*.txt', { query: '?raw', import: 'default', eager: true });
const BANK = Object.values(bankFiles).flatMap((t) => parseMc(t));

const pick = makePicker();
export const TEN_MIEN = { bac: 'đội Đỏ', trung: 'đội Vàng', nam: 'đội Xanh' } as const;
const GOI_MIEN = { bac: 'Đỏ', trung: 'Vàng', nam: 'Xanh' } as const;
const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});

/**
 * Trang stage chạy game thật (KyThi) và gửi ảnh chụp lên server.
 * Trang điều khiển chỉ vẽ lại ảnh chụp đó, không tự chạy game (tránh 2 bộ câu khác nhau).
 */
export function useGame() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);
  const [caiDatGoc, setCaiDat] = useState({ tieuDe: '', tenOngDo: '' });
  const caiDat = { tieuDe: caiDatGoc.tieuDe || GAME.tieuDeMacDinh, tenOngDo: caiDatGoc.tenOngDo || GAME.tenOngDoMacDinh };
  const [room] = useState(() => new KyThi(BANK));
  if (import.meta.env.DEV) Object.assign(window as any, { __room: room, __sfx: sfx }); // để thử các màn trong trình duyệt
  const [talk] = useState(() => ({
    greeter: new NameBatcher(
      GAME.greetEveryMs,
      GAME.namesPerGreeting,
      (names) => voice.say(GAME.greeting(joinNames(names))),
      () => voice.waiting >= 1,
    ),
    gifts: new GiftThanker(GAME.giftThanksCooldownMs, GAME.bigGiftCoins),
    follows: new OncePerPerson(),
    wishes: new WishLimiter(GAME.wishPerUserMs, GAME.wishGlobalMs),
    recent: new RecentPeople(),
    treu: new Treu(),
  }));
  const [kenh] = useState(() => ({ current: GAME.defaultChannelName }));
  kenh.current = channelName;

  // Tên an toàn để hiện/đọc: tên có từ cấm thì dùng username
  const safeName = (nickname: string, username: string) => (containsBanned(nickname) ? username : nickname);

  // Quan chủ khảo đọc theo sự kiện của game. Câu của game đi làn ưu tiên để không bị lời chào chen trước.
  const speak = (ev: Ev) => {
    const L = GAME.loi;
    switch (ev.t) {
      case 'cho': {
        const dau = room.tuan[0];
        // thỉnh thoảng nhắc người dẫn đầu bảng vàng tuần, để người chơi có lý do quay lại
        const them = dau && Math.random() < 0.5 ? ` ${pick(L.tuanDau)?.(speakableName(dau.name))}` : '';
        return voice.say((pick(L.cho) ?? '') + them, true);
      }
      case 'vong':
        if (ev.vong === 0 && voice.speaker) void post('/api/da-hoi', room.used); // ván mới vừa bốc câu: lưu lại để lần sau ưu tiên câu khác
        return voice.say(pick(L.vong[ev.vong] ?? []) ?? '', true);
      case 'doc': {
        const cau = room.cau;
        voice.prefetch(room.dapAnText()); // tạo sẵn giọng công bố đáp án trong lúc mọi người trả lời
        // Đọc xong đề mới hiện 4 đáp án và tính giờ
        return voice.say(ev.text, true, () => room.cau === cau && room.docXong(Date.now()));
      }
      case 'chot':
        return voice.say(pick(L.hetGio) ?? '', true);
      case 'nhac':
        return voice.say(pick(L.nhac) ?? '');
      case 'latKeo':
        return voice.say(pick(L.latKeo) ?? '', true);
      case 'thach':
        return voice.say(pick(L.thach) ?? '', true);
      case 'dauBang':
        return voice.say(pick(L.dauBang)?.(speakableName(ev.name)) ?? '', true);
      case 'mienKem':
        return voice.say(pick(L.mienKem)?.(TEN_MIEN[ev.mien], GOI_MIEN[ev.mien]) ?? '');
      case 'saiLien':
        return talk.treu.them(ev.id, ev.name, 'sai', Date.now());
      case 'cuuTro':
        return voice.say(pick(L.cuuTro) ?? '', true);
      case 'dapAn': {
        const nhanh = ev.nhanh ? speakableName(ev.nhanh) : 'bạn';
        // Cảm xúc theo tỉ lệ đúng: gần hết đúng thì cười, ít đúng thì trêu, không ai đúng thì thở dài
        const tile = ev.soNop ? ev.soDung / ev.soNop : 0;
        const nhom = tile >= 0.75 ? L.deQua : tile < 0.3 ? L.itDung : L.dungNhieu;
        const them =
          ev.soDung === 0 ? pick(L.khongAi)
          : ev.soDung === 1 ? pick(L.dungMot)?.(nhanh)
          : pick(nhom)?.(ev.soDung, nhanh);
        const khen = ev.soDung > 0 && (ev.msNhanh ?? 9e9) < 2000 ? pick(L.thanDong)?.(nhanh) : '';
        // không ai đúng: thở dài trước rồi mới đọc đáp án
        // "B, chim sẻ!" đã tạo sẵn nên nói ngay lúc ô nhấp nháy; lời bình đọc tiếp theo
        voice.say(room.dapAnText(), true);
        voice.say(`${them ?? ''} ${khen ?? ''}`.trim(), true);
        const sau = room.docText(room.cauSo); // đề câu kế: tạo sẵn giọng
        if (sau) voice.prefetch(sau);
        return;
      }
      case 'bangVang':
        voice.say(ev.dau ? pick(L.bangVang)!(ev.vong, speakableName(ev.dau)) : L.bangVangTrong(ev.vong), true);
        if (ev.dau && Math.random() < 0.6) voice.say(pick(L.coVuSau) ?? '', true);
        return;
      case 'vinhQuy': {
        // cộng điểm ván này vào bảng vàng tuần
        const ds = [...room.siTu.values()].filter((s) => s.diem > 0).map(({ id, name, avatar, diem }) => ({ id, name, avatar, diem }));
        if (ds.length && voice.speaker) void layTuan(post('/api/bang-tuan', { ds }));
        const [tn, bn, th] = ev.top.map(speakableName);
        voice.say(tn ? L.vinhQuy(tn, bn, th) : L.khongAiThi, true);
        if (ev.mien) voice.say(L.mienThang(TEN_MIEN[ev.mien.mien], ev.mien.diem), true);
        return;
      }
    }
  };

  useLiveEvents({
    onStatus: setStatus,
    onGameState: (s) => !IS_STAGE && setView(s),
    onCaiDat: setCaiDat,

    onChat: (e) => {
      if (!IS_STAGE) return;
      const name = safeName(e.nickname, e.username);
      room.chat({ id: e.username, name, avatar: e.avatar, comment: e.comment, createTime: e.createTime }, Date.now());
      talk.recent.note(e.username, speakableName(name));
      // Bình luận kiểu "khó quá", "dễ", "chào", "haha"... -> xếp hàng để ông đồ trêu lại vào khoảng lặng
      const loai = containsBanned(e.comment) ? null : loaiCmt(e.comment);
      if (loai) talk.treu.them(e.username, name, loai, Date.now());
      // Comment có lời cầu chúc -> đọc 1 câu chúc soạn sẵn (không bao giờ đọc nguyên văn comment)
      const topic = containsBanned(e.comment) ? null : detectWish(e.comment);
      const reply = topic && pick(GAME.wishReplies[topic] ?? []);
      if (reply && talk.wishes.allow(e.username)) voice.say(reply(speakableName(name)));
    },

    onGift: (e) => {
      if (!IS_STAGE) return;
      const name = safeName(e.nickname, e.username);
      const coins = e.diamondCount * e.repeatCount;
      // băng rôn cảm ơn trên màn hình (người tặng thấy mình); quà KHÔNG cho lợi thế trong game
      room.tangQua({ id: e.username, name, avatar: e.avatar, gift: e.giftName, count: e.repeatCount, coins, big: coins >= GAME.bigGiftCoins }, Date.now());
      // Quà không cho lợi thế trong game, chỉ cảm ơn (combo 1 lần / 30 giây, quà to luôn cảm ơn)
      if (talk.gifts.shouldThank(e.username, coins, voice.waitingPriority)) {
        // quà mức nào (xu 1 món) thì ông đồ đáp lời mức đó; quà lạ dưới 1 xu thì cảm ơn chung
        const muc = [...GAME.giftMenu].reverse().find((m) => e.diamondCount >= m.xu);
        const loi = muc && pick(muc.cam)?.(speakableName(name));
        voice.say(loi ?? GAME.thankGift(speakableName(name), e.giftName, kenh.current), true);
        if (!loi) {
          const wish = pick(GAME.giftWishes);
          if (wish) voice.say(wish, true);
        }
      }
    },

    onMember: (e) => {
      if (!IS_STAGE) return;
      const spoken = speakableName(safeName(e.nickname, e.username));
      if (spoken !== 'bạn') talk.greeter.add(e.username, spoken);
    },

    // Tim: Thi Đình đủ tim thì cứu trợ cả phòng (loại 2 đáp án sai)
    onLike: (e) => {
      if (IS_STAGE) room.tim(e.likeCount);
    },

    onFollow: (e) => {
      if (!IS_STAGE) return;
      if (talk.follows.first(e.username)) voice.say(GAME.thankFollow(speakableName(safeName(e.nickname, e.username)), kenh.current));
    },

    onControl: (c) => {
      if (c.action === 'setName' && c.text) setChannelName(c.text);
      if (!IS_STAGE) return; // chỉ trang stage làm theo lệnh, tránh 2 giọng
      const now = Date.now();
      if (c.action === 'speak' && c.text) voice.say(c.text, true);
      if (c.action === 'setRate' && c.text) voice.rate = Number(c.text) || 1;
      if (c.action === 'reset') {
        voice.stop();
        room.cho(now);
      }
      if (c.action === 'custom' && c.text === 'batdau') {
        voice.stop();
        room.batDau(now);
      }
      if (c.action === 'custom' && c.text === 'bocau') {
        room.boCau(now);
        void post('/api/da-hoi', room.used); // nhớ câu bị bỏ, tắt bật lại vẫn không hỏi
      }
    },
  });

  // Vòng chạy game trên trang stage
  useEffect(() => {
    if (!IS_STAGE) return;
    let ready = false;
    let lastPost = 0;
    let prev: View | null = null;
    void layTuan(fetch('/api/bang-tuan'));
    // câu chung đọc nhiều lần: tạo giọng sẵn ngay từ đầu
    [...GAME.loi.hetGio, ...GAME.loi.nhac, ...GAME.loi.latKeo, ...GAME.loi.cuuTro, ...GAME.loi.thach, ...GAME.loi.coVuSau].forEach((t) => voice.prefetch(t));
    if (MUTE) sfx.volume = sfx.musicVolume = 0;
    sfx.loadFiles();
    fetch('/api/da-hoi')
      .then((r) => r.json())
      .then((u) => Object.assign(room.used, u))
      .catch(() => {})
      .finally(() => {
        if (!room.endsAt) room.cho(Date.now()); // chủ kênh đã bấm "Bắt đầu ngay" trong lúc chờ thì thôi
        ready = true;
      });
    const id = setInterval(() => {
      if (!ready) return;
      const now = Date.now();
      room.tick(now);
      room.lay().forEach(speak);
      // khoảng lặng: đang chờ trả lời (còn hơn 6 giây) hoặc chờ ván / bảng vàng, giọng đang rảnh -> trêu 1 câu
      const lang = (room.phase === 'hoi' && room.endsAt - now > 6000) || room.phase === 'cho' || room.phase === 'bangVang';
      if (lang && !voice.busy) {
        const x = talk.treu.lay(now);
        const line = x && pick(GAME.loi.treu[x.loai])?.(speakableName(x.name), room.view(now).vongTen);
        if (line) voice.say(line);
      }
      const v = room.view(now);
      setView(v);
      if (voice.speaker) sfx.watch(prev, v, voice.busy);
      else sfx.music('tat', false); // trang phụ: tắt nhạc
      prev = v;
      if (voice.speaker && now - lastPost >= 500) {
        lastPost = now;
        void post('/api/game/state', v);
      }
    }, 250);
    const share = setInterval(() => {
      const line = pick(GAME.shareLines);
      if (line) voice.say(line);
    }, GAME.shareReminderEveryMs);
    return () => {
      clearInterval(id);
      clearInterval(share);
    };
  }, []);

  // Đọc bảng vàng tuần server trả về, gắn vào game để hiện lúc chờ ván mới
  async function layTuan(r: Promise<Response | void>) {
    try {
      const res = await r;
      if (res) room.tuan = (await res.json()).top ?? [];
    } catch {
      // server chưa bật: bỏ qua
    }
  }

  return { status, channelName, view, caiDat };
}

export type GameState = ReturnType<typeof useGame>;

// ['An', 'Bình', 'Chi'] -> 'An, Bình và Chi'
function joinNames(names: string[]) {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} và ${names[names.length - 1]}` : names[0] ?? '';
}
