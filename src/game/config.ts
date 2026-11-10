// =====================================================
//  CẤU HÌNH GAME "AI LÀ TRẠNG NGUYÊN" - thay đổi nhỏ chỉ cần sửa file này
//  Câu đọc: `name` = tên người xem (đã làm sạch), `kenh` = tên kênh (ô "Tên kênh" ở trang điều khiển)
// =====================================================

import type { WishTopic } from '../live/chatter';

// Nhóm câu trong các file src/game/cau-hoi/*.txt:
//   [de] khảo hạch · [vua] thi Hương · [kho] thi Hội · [dinh] thi Đình (khó, khoa cử) · [meo] đố mẹo
export type Level = 'de' | 'vua' | 'kho' | 'dinh' | 'meo';

export interface Vong {
  ten: string; // đọc + hiện ở bảng
  nhan: string; // nhãn ngắn trên tab
  cau: number; // số câu = tổng phan + 1 câu toán
  giay: number; // thời gian trả lời mỗi câu
  diem: number; // điểm tối đa khi đúng ngay giây đầu
  phan: [Level, number][]; // lấy bao nhiêu câu mỗi nhóm
  toan: number; // cấp câu toán tự sinh (1-4), 0 = không có
}

export const GAME = {
  title: 'Ai Là Trạng Nguyên',
  // mặc định khi trang điều khiển để trống
  tieuDeMacDinh: 'AI LÀ TRẠNG NGUYÊN', // chữ trên mái tranh
  tenOngDoMacDinh: 'Ông Đồ', // bảng tên trên đầu ông đồ
  defaultChannelName: 'kênh mình',

  // ---------- Luật thi: 4 vòng, 20 câu ----------
  vong: [
    { ten: 'Khảo hạch trường làng', nhan: 'KHẢO HẠCH', cau: 5, giay: 10, diem: 100, phan: [['de', 4]], toan: 1 },
    { ten: 'Thi Hương', nhan: 'THI HƯƠNG', cau: 5, giay: 15, diem: 200, phan: [['vua', 4]], toan: 2 },
    { ten: 'Thi Hội', nhan: 'THI HỘI', cau: 5, giay: 20, diem: 300, phan: [['kho', 4]], toan: 3 },
    { ten: 'Thi Đình', nhan: 'THI ĐÌNH', cau: 5, giay: 25, diem: 500, phan: [['dinh', 2], ['meo', 2]], toan: 4 },
  ] as Vong[],
  saiTru: 0.5, // sai bị trừ nửa điểm tối đa của vòng; tổng điểm không xuống dưới 0
  diemSan: 0.5, // đúng sát giờ vẫn được 50% điểm tối đa
  latKeoNhan: 2, // câu cuối ván (câu nước rút): điểm cộng và trừ đều nhân đôi
  cuuTroTim: 200,
  thachTiLe: 0.4, // bao nhiêu phần câu hỏi ông đồ thách thức trước khi đọc đề
  dauBangCach: 3, // đổi ngôi đầu bảng: cách ít nhất 3 câu mới hô lại
  mienCach: 5, // cổ vũ phe miền đang thua: 5 câu 1 lần // Thi Đình: cả phòng thả đủ chừng này tim thì loại 2 đáp án sai
  chuoiMoi: 3, // đúng liền 3 câu thì thưởng
  chuoiThuong: 100,
  earlySendGraceMs: 500, // gửi trước lúc hiện đáp án quá 0,5 giây thì không tính (không mất lượt)

  // ---------- Nhịp (giây) ----------
  choSec: 15, // đếm ngược trước ván mới
  vongSec: 5, // bảng giới thiệu vòng
  docMaxSec: 25, // giọng đọc đề hỏng thì tối đa chừng này giây là tự hiện đáp án
  chotSec: 2.6, // "Hết giờ!" + trống dồn trước khi công bố
  dapAnSec: 7,
  bangVangSec: 9, // hết mỗi vòng hiện top 20
  vinhQuySec: 15,

  // Danh hiệu theo hạng trong ván
  danhHieu: (hang: number) =>
    hang === 1 ? 'Trạng Nguyên'
    : hang === 2 ? 'Bảng Nhãn'
    : hang === 3 ? 'Thám Hoa'
    : hang <= 10 ? 'Tiến sĩ'
    : hang <= 15 ? 'Cử nhân'
    : hang <= 20 ? 'Tú tài'
    : 'Sĩ tử',

  // ---------- Lời quan chủ khảo (ông đồ hóm hỉnh, hay trêu sĩ tử) ----------
  // Thẻ cảm xúc của giọng VieNeu: [cười] [thở dài] [hắng giọng]. Giọng Edge tự bỏ thẻ, không đọc ra.
  // Mỗi nhóm nhiều câu, bốc ngẫu nhiên cho đỡ lặp.
  loi: {
    cho: [
      '[hắng giọng] Trường thi sắp mở cửa! Sĩ tử nào muốn đỗ Trạng thì mài mực sẵn đi, quét mã rồi bấm đáp án trên điện thoại.',
      'Ván mới sắp bắt đầu rồi đây. Đúng càng nhanh điểm càng cao, mà sai là ông trừ điểm đấy nhé. [cười]',
      'Ai vừa đến thì nghe ông dặn này: quét mã trên màn hình, nhập tên là thành sĩ tử luôn, không cần nộp hồ sơ. [cười]',
    ],
    vong: [
      [
        '[hắng giọng] Khảo hạch trường làng bắt đầu! Năm câu dễ thôi, mười giây một câu, bấm A, B, C hoặc D nhé.',
        'Vào khảo hạch trường làng nào. Câu dễ như ăn kẹo, ai sai thì về nhà ôn lại đi. [cười]',
      ],
      [
        'Qua được làng rồi, giờ lên kinh thi Hương! Câu khó hơn, mười lăm giây một câu.',
        '[hắng giọng] Thi Hương bắt đầu! Từ đây là bắt đầu phân loại sĩ tử rồi đấy.',
      ],
      [
        'Vào thi Hội! Sai một câu là mất ba trăm điểm như chơi, nghĩ kỹ rồi hãy bấm.',
        '[hắng giọng] Thi Hội đây. Câu bắt đầu khó, đừng có đoán bừa mà mất điểm oan nhé.',
      ],
      [
        '[hắng giọng] Thi Đình! Năm câu cuối, mỗi câu năm trăm điểm. Trạng Nguyên hôm nay là ai, sắp biết rồi!',
        'Đây là thi Đình rồi. Ai đang thua thì vẫn lội ngược dòng được, chỉ cần trả lời nhanh và đúng. Bắt đầu!',
      ],
    ],
    // hết giờ, trống dồn: câu chung nên giọng được tạo sẵn từ đầu buổi, nói ngay không phải chờ
    hetGio: ['Hết giờ! Đáp án đúng là...', 'Hết giờ rồi! Và đáp án chính xác là...', 'Dừng bút! Đáp án đúng là...'],
    // giục giữa giờ
    nhac: [
      'Nhanh tay lên các sĩ tử!',
      'Ai chưa nộp bài thì bấm đi nào!',
      'Thời gian không chờ đợi ai đâu nhé!',
      '[cười] Nghĩ kỹ chưa đấy?',
      'Cố lên các sĩ tử, sai thì câu sau gỡ lại!',
      'Không chắc thì loại dần đáp án sai đi, còn kịp đấy!',
      'Cả trường cố lên nào, ông đang nhìn đây!',
      '[cười] Ai đang phân vân thì nhắm mắt chọn đại cũng được, nhưng sai là trừ điểm đấy nhé.',
    ],
    // thách thức trước khi đọc đề
    thach: [
      'Câu này mà ai đúng thì ông xin bái phục!',
      '[cười] Câu tiếp theo hơi xoắn não đấy, tập trung vào!',
      'Sĩ tử nào tự nhận là giỏi thì chứng minh ở câu này đi!',
      'Ông đoán câu này cả trường sẽ chia làm bốn phe. Thử xem nào!',
      'Ai trả lời đúng câu này nhanh nhất, ông khen cả buổi!',
      '[hắng giọng] Câu này phân biệt sĩ tử với trạng nguyên đây!',
      'Nghe kỹ nhé, câu này ông ra để thử bản lĩnh.',
      'Câu này dễ hay khó là tùy người đấy. [cười] Ông thì thấy dễ.',
    ],
    // có người vượt lên dẫn đầu ván
    dauBang: [
      (n: string) => `${n} vừa vượt lên dẫn đầu! Ai muốn giành lại thì nhanh tay lên!`,
      (n: string) => `[cười] Ngôi đầu đổi chủ rồi, giờ là ${n}! Bảng vàng gay cấn quá.`,
      (n: string) => `${n} lên đỉnh bảng vàng rồi. Có ai dám thách đấu không?`,
      (n: string) => `Cả trường ơi, ${n} đang ngồi ghế đầu. Kéo xuống đi chứ!`,
    ],
    // phe miền đang thua điểm
    mienKem: [
      (m: string, goi: string) => `${m} đang bị bỏ lại phía sau, cố lên nào!`,
      (m: string, goi: string) => `Các bạn ${m} đâu cả rồi? Kéo điểm lên đi chứ!`,
      (m: string) => `[cười] ${m} ơi, điểm thấp nhất trường rồi đấy. Gỡ lại đi chứ!`,
    ],
    // cổ vũ người xếp sau, đọc thêm ở bảng vàng
    coVuSau: [
      'Ai đang xếp sau đừng nản, câu phía sau điểm cao lắm!',
      'Còn cơ hội lội ngược dòng, cố lên các sĩ tử!',
      'Bảng vàng còn đổi chỗ dài dài, chưa ai chắc đỗ đâu.',
    ],
    // gần như cả trường đúng
    deQua: [
      (n: number, name: string) => `[cười] Dễ quá phải không! ${n} người đúng, nhanh nhất là ${name}.`,
      (n: number, name: string) => `Cả trường thi đúng gần hết! Nhanh tay nhất là ${name}.`,
    ],
    // bình thường
    dungNhieu: [
      (n: number, name: string) => `${n} người trả lời đúng, nhanh nhất là ${name}.`,
      (n: number, name: string) => `Có ${n} người đúng. ${name} bấm nhanh nhất câu này, giỏi!`,
    ],
    // ít người đúng
    itDung: [
      (n: number, name: string) => `Ối giời ơi, câu này lừa được cả khối người! Chỉ ${n} người đúng, nhanh nhất là ${name}.`,
      (n: number, name: string) => `[cười] Câu này đánh rơi khối sĩ tử nhé. Có ${n} người đúng thôi, đứng đầu là ${name}.`,
    ],
    dungMot: [
      (name: string) => `Cả trường thi chỉ mình ${name} đúng! [cười] Nhân tài đây chứ đâu.`,
      (name: string) => `Một mình ${name} trả lời đúng, ông phải ghi tên vào sổ mới được.`,
    ],
    khongAi: [
      '[thở dài] Không ai đúng câu nào. Sĩ tử bây giờ lười đọc sách quá.',
      '[thở dài] Câu này ông hỏi cả trường mà không ai trả lời được. Thôi, sang câu khác.',
    ],
    // người nhanh nhất đúng trong 2 giây đầu
    thanDong: [
      (name: string) => `${name} mới nhìn đề đã trả lời, đúng là thần đồng!`,
      (name: string) => `[cười] ${name} nhanh như chớp, ông còn chưa kịp vuốt râu.`,
    ],
    bangVang: [
      (vong: string, name: string) => `Hết ${vong}. Đứng đầu bảng vàng lúc này là ${name}. Ai muốn giật ngôi thì cố lên!`,
      (vong: string, name: string) => `Xong ${vong}. ${name} đang dẫn đầu, [cười] nhưng chưa đỗ Trạng đâu, đừng vội mừng.`,
    ],
    bangVangTrong: (vong: string) => `Hết ${vong}. Bảng vàng vẫn trống, ai vào thi đi chứ!`,
    vinhQuy: (tn: string, bn?: string, th?: string) =>
      `[cười] Xin chúc mừng ${tn} đỗ Trạng Nguyên!` +
      (bn ? ` Bảng Nhãn là ${bn}.` : '') +
      (th ? ` Thám Hoa là ${th}.` : '') +
      ' Vinh quy bái tổ thôi, cả làng ra đón nào!',
    tuanDau: [
      (name: string) => `Tuần này ${name} đang đứng đầu bảng vàng, ai muốn vượt thì vào thi đi!`,
      (name: string) => `Bảng vàng tuần vẫn gọi tên ${name}. [cười] Có ai dám tranh ngôi không?`,
    ],
    latKeo: [
      '[hắng giọng] Câu cuối cùng, câu nước rút! Điểm nhân đôi, ai đang thua vẫn còn cơ hội đấy!',
      'Đây là câu nước rút! Đúng được gấp đôi điểm, sai cũng mất gấp đôi. Cẩn thận nhé!',
    ],
    cuuTro: [
      '[cười] Cả trường thả tim đủ rồi! Ông bỏ giúp hai đáp án sai nhé.',
      'Tim đầy rồi! Ông đồ ra tay, loại bớt hai đáp án sai cho cả phòng.',
    ],
    mienThang: (mien: string, diem: number) => `${mien} thắng ván này với ${diem} điểm! Ván sau đội nào gỡ lại đây?`,
    // Trêu / đáp bình luận vào khoảng lặng (KHÔNG đọc nguyên văn bình luận). vong = tên kỳ thi đang thi
    treu: {
      kho: [
        (n: string, vong: string) => `${n} than khó à? Mới ${vong} thôi đấy, lên thi Đình còn khó nữa cơ. [cười]`,
        (n: string) => `${n} kêu khó, ông nghe thấy rồi nhé. Học đâu chắc đó, thi đâu đỗ đó!`,
      ],
      de: [
        (n: string) => `${n} chê dễ hả? Được, câu sau ông cho khó hơn. [cười]`,
        (n: string) => `Dễ thì ${n} trả lời nhanh lên cho ông xem nào!`,
      ],
      chao: [
        (n: string) => `Chào ${n}! Ngồi vào chỗ đi, sắp có câu hỏi rồi.`,
        (n: string) => `À ${n} đến rồi. Mài mực đi, sắp có câu hỏi đấy.`,
      ],
      goiY: [
        (n: string) => `${n} xin gợi ý à? [cười] Trường thi không có quay cóp đâu nhé!`,
        (n: string) => `Ông không nhắc bài đâu ${n}. Đến thi Đình thả tim thì cả phòng được cứu trợ.`,
      ],
      cuoi: [
        (n: string) => `${n} cười gì đấy? Trả lời đúng chưa mà cười. [cười]`,
        (n: string) => `Nghe ${n} cười là biết vừa trả lời đúng rồi.`,
      ],
      yeu: [
        (n: string) => `Cảm ơn ${n} nhé, ông đồ vui lắm. [cười]`,
        (n: string) => `${n} khen thế thì ông phải ra câu hay hơn mới được.`,
      ],
      sai: [
        (n: string) => `[thở dài] ${n} sai ba câu liền rồi. Bình tĩnh, đọc kỹ đề rồi hãy bấm nhé.`,
        (n: string) => `${n} ơi, ba câu liền chưa trúng câu nào. [cười] Câu sau phải gỡ lại đấy!`,
      ],
    },
    khongAiThi: '[thở dài] Ván này trường thi vắng tanh. Ván sau mọi người vào thi cho vui nhé.',
  },

  // ---------- Chào người vào ----------
  greetEveryMs: 8000,
  namesPerGreeting: 3,
  greeting: (names: string) => `Chào ${names} vào trường thi.`,

  // ---------- Cảm ơn quà (quà KHÔNG cho lợi thế gì trong game) ----------
  giftThanksCooldownMs: 30_000,
  quaSec: 4, // băng rôn cảm ơn quà nhỏ hiện bao lâu
  quaToSec: 8, // quà to (từ bigGiftCoins xu)
  tuanTop: 10, // bảng vàng tuần hiện bao nhiêu người
  soTre: 6, // số đứa trẻ chạy lên chạy xuống lối giữa sân (mang tên người chưa có ghế)
  soGhe: 31, // số chỗ ngồi sĩ tử trong sân thi (toạ độ bàn ở HANG trong GameStage.tsx)
  bigGiftCoins: 99,
  thankGift: (name: string, gift: string, kenh: string) => `${kenh} cảm ơn ${name} đã tặng ${gift}.`,
  // Bảng "Gửi tặng ông đồ" cạnh ông đồ: mỗi mức xu 1 món đại diện (theo bảng quà TikTok VN, skill tao-game-moi/qua-tiktok.md).
  // Quà mức nào (tính theo xu 1 món) thì ông đồ đáp lời mức đó. Viết kiểu gửi tặng cho vui: KHÔNG giục, KHÔNG hứa điểm hay lợi thế.
  giftMenu: [
    {
      xu: 1, icon: '🌹', ten: 'Hoa hồng', viec: 'Tặng ông đồ bông hoa',
      cam: [
        (n: string) => `${n} tặng ông bông hồng. [cười] Ông cắm ngay lên nghiên mực đây.`,
        (n: string) => `Hoa của ${n} thơm quá, ông đồ dạy học bao năm mới được tặng hoa đấy.`,
      ],
    },
    {
      xu: 5, icon: '🫰', ten: 'Bắn tim', viec: 'Bắn tim cho ông đồ',
      cam: [
        (n: string) => `Ối, ${n} bắn trúng tim ông rồi! [cười] Già rồi mà vẫn rung rinh.`,
        (n: string) => `${n} bắn tim cho ông, ông nhận nhé. Thi tiếp cho vui nào!`,
      ],
    },
    {
      xu: 10, icon: '🐷', ten: 'Chú heo may mắn', viec: 'Góp heo đất trường thi',
      cam: [
        (n: string) => `${n} góp heo đất cho trường thi. Ông chúc ${n} học đâu nhớ đó!`,
        (n: string) => `[cười] Chú heo của ${n} béo tròn thế này, cả trường thi được lộc rồi.`,
      ],
    },
    {
      xu: 100, icon: '🎆', ten: 'Thả tim', viec: 'Bắn pháo hoa mừng sĩ tử',
      cam: [
        (n: string) => `${n} bắn pháo hoa mừng cả trường thi! Ông đồ xin vái tạ ơn tấm lòng.`,
        (n: string) => `Pháo hoa của ${n} sáng rực cả làng rồi. [cười] Sĩ tử nào cũng được ăn mừng ké nhé!`,
      ],
    },
  ],
  giftWishes: ['Chúc bạn thi đâu đỗ đó.', 'Chúc bạn một ngày thật vui.', 'Chúc bạn làm gì cũng suôn sẻ nha.'],

  thankFollow: (name: string, kenh: string) => `${kenh} cảm ơn ${name} đã theo dõi kênh nha.`,

  // Comment có lời cầu chúc: đọc 1 câu chúc soạn sẵn, KHÔNG BAO GIỜ đọc nguyên văn comment
  wishPerUserMs: 10 * 60_000,
  wishGlobalMs: 20_000,
  wishReplies: {
    exam: [
      (name: string) => `Chúc ${name} ôn bài vô đầu, vào phòng thi thật bình tĩnh.`,
      (name: string) => `Chúc ${name} học đâu nhớ đó, thi đâu đỗ đó.`,
    ],
    health: [(name: string) => `Chúc ${name} với người nhà mau khỏe, ăn ngon ngủ yên.`],
    love: [(name: string) => `Chúc ${name} sớm gặp người thương mình thật lòng.`],
    family: [(name: string) => `Chúc nhà ${name} luôn êm ấm, ai cũng khỏe.`],
    work: [(name: string) => `Chúc ${name} công việc thuận lợi, sớm được như ý.`],
    wealth: [(name: string) => `Chúc ${name} làm ăn phát đạt, tiền vô đều tay.`],
    peace: [(name: string) => `Chúc ${name} mọi chuyện bình an, thuận lợi.`],
  } as Record<WishTopic, ((name: string) => string)[]>,

  // Nhắc chia sẻ live mỗi 5 phút
  shareReminderEveryMs: 5 * 60_000,
  shareLines: [
    'Ai thấy vui thì bấm chia sẻ live, rủ bạn bè vào thi cùng nha.',
    'Rủ thêm bạn vào thi cho đông, bấm chia sẻ live giúp kênh nhé.',
  ],
};
