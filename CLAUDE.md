# Ai Là Trạng Nguyên, BẢN QUÉT MÃ QR: ghi chú cho Claude

> Thư mục này là bản riêng tách từ `../ai-la-trang-nguyen` (bản TikTok LIVE) ngày 2026-11-10. Repo GitHub CÔNG KHAI: https://github.com/workaipvlinh-byte/ai-la-trang-nguyen-qr (zip ở Releases, tag v1.0.0). Chỉ push khi chủ kênh bảo; ra bản zip mới thì npm run dong-goi rồi tạo release mới.
> Không có TikTok: người chơi quét mã QR, chơi bằng trang web trên điện thoại. Mục "Bản quét QR" ngay dưới là riêng bản này;
> các mục còn lại chép từ bản TikTok (luật chơi, câu hỏi, giọng ông đồ dùng chung). Sửa luật chung thì cân nhắc sửa cả 2 bản.

## Bản quét QR (2026-11-10)

- Cổng 3017 = màn hình lớn + trang điều khiển (chỉ máy host, 127.0.0.1). Cổng 3018 = trang điện thoại (0.0.0.0), chỉ có `/` và `/api/choi/*` (`choi.ts`). Đường hầm chỉ trỏ vào 3018 nên người lạ không chạm được lệnh điều khiển.
- Điện thoại bấm A/B/C/D, nút cảm xúc (Khó quá, Dễ ợt, Haha, Hay quá), thả tim (chỉ Thi Đình). Server đổi thành sự kiện "chat"/"like" giả như TikTok nên game chạy y nguyên. KHÔNG có ô gõ chữ tự do. Không có quà.
- Điện thoại hỏi `/api/choi/trang-thai` mỗi giây (đường hầm Cloudflare bản nhanh KHÔNG hỗ trợ SSE, tối đa 200 yêu cầu cùng lúc). Điểm từng người lấy từ `view().ban`.
- 3 miền đổi thành 3 đội: Đỏ (bac) / Vàng (trung) / Xanh (nam), chọn lúc vào. Tên đội ở `MIEN` (GameStage), `TEN_MIEN` (useGame).
- Đường hầm: `duong-ham.ts` chạy `bin/cloudflared.exe` (không đưa vào git), chỉ đưa địa chỉ lên mã QR khi đã tự vào thử được (mấy giây đầu Cloudflare trả lỗi 530); không có hầm thì QR dùng IP Wi-Fi. `KHONG_DUONG_HAM=1` để tắt.
- Chống phá: tên qua `containsBanned`, tối đa 500 người, 200 lượt vào/phút/IP (chỉ tin `cf-connecting-ip` khi đến từ 127.0.0.1), mỗi máy 6 lần bấm/2 giây, im 10 phút thì bị rời.
- Giọng: mặc định chỉ Edge (máy khách không có VieNeu); muốn VieNeu thì đặt biến VIENEU_VOICE.
- Màn hình ngang: khung QR to bên trái sân thi (`KhungQr.tsx`); màn hình dọc: QR nhỏ góc trên. Chữ trên màn hình không nhắc Zalo (chủ kênh, 2026-11-10).
- Không có BAT-LIVE.bat (file mở bản TikTok, đã xoá 2026-11-10 để người tải không nhầm). Người host dùng goi/MO-TRUONG-THI.bat trong zip; sửa code thì chạy npm run dev.
- Đóng gói: `npm run dong-goi` ra `ban-phat-hanh/TrangNguyen-QR.zip` (~65 MB): node.exe (Node 24 LTS, kiểm mã băm), thư viện chạy (không có React/vite vì đã dựng vào dist), cloudflared, `goi/MO-TRUONG-THI.bat` + `goi/HUONG-DAN.txt`. Không cần cài gì; đã thử chạy từ thư mục có dấu & và dấu cách. BAT chặn khi bấm ngay trong zip (đường dẫn có AppData\Local\Temp); server tự mở trình duyệt khi sẵn sàng (MO_TRINH_DUYET=1).

> File này mô tả RIÊNG game này. Luật chung cho mọi game nằm ở `E:\01_Projects\VibeCode\CLAUDE.md`.
> Khi chủ kênh chốt một quyết định (câu đọc, màu, luật chơi), ghi vào mục "Quyết định của chủ kênh".

## Ý tưởng

Game show trắc nghiệm cho TikTok LIVE theo không khí khoa cử xưa. Ông đồ cầm mic làm quan chủ khảo, người xem gõ A, B, C, D vào bình luận. Một ván 20 câu qua 4 kỳ thi, cuối ván 3 người cao điểm nhất đỗ Trạng Nguyên, Bảng Nhãn, Thám Hoa. Lấy cảm hứng từ Ai là triệu phú nhưng không dùng tên, giao diện, nhạc hay câu thoại của show đó.

## Luật chơi

- Ai cũng chơi được, không cần gõ từ khoá tham gia. Gõ đáp án là có tên trong trường thi.
- 4 kỳ thi, mỗi kỳ 5 câu (`GAME.vong` trong config.ts):
  Khảo hạch trường làng 10 giây +100 / −50 · Thi Hương 15 giây +200 / −100 · Thi Hội 20 giây +300 / −150 · Thi Đình 25 giây +500 / −250.
- Mỗi kỳ: 4 câu viết sẵn + 1 câu toán tự sinh ở vị trí thứ 3 (khó dần: cộng trừ 2 chữ số, nhân/cộng số lớn, nhân 2 chữ số/chia, phép tính 2 bước). Thi Đình: 2 câu [dinh] + 2 câu đố mẹo [meo] + 1 toán.
- Điểm tốc độ: đúng ngay giây đầu được tối đa, sát giờ được 50% (`diemSan`). Tính theo giờ TikTok gắn lúc gửi (`createTime`), không theo lúc server nhận.
- Sai bị trừ nửa điểm tối đa của kỳ; tổng điểm không xuống dưới 0. Không trả lời thì 0 điểm.
- Đúng liền 3 câu thì +100 (`chuoiMoi`, `chuoiThuong`); sai hoặc bỏ câu thì chuỗi tính lại.
- Mỗi người chỉ tính lần trả lời đầu tiên của câu. Nhận "a", "C.", "đáp án b", "chọn D", "câu c".
- Quan chủ khảo đọc xong đề và 4 đáp án thì 4 ô mới hiện và mới tính giờ. Gửi trước lúc hiện quá 0,5 giây thì không tính, không mất lượt.
- Đang hỏi không hiện tỉ lệ từng đáp án (tránh người vào sau chép số đông), chỉ hiện số người đã nộp. Tỉ lệ hiện lúc công bố đáp án.
- Bằng điểm: ai có tổng thời gian trả lời đúng ngắn hơn xếp trên, rồi tới ai vào trước.
- Danh hiệu theo hạng: 1 Trạng Nguyên, 2 Bảng Nhãn, 3 Thám Hoa, 4-10 Tiến sĩ, 11-15 Cử nhân, 16-20 Tú tài.
- Hết mỗi kỳ thi hiện Bảng vàng top 20 (9 giây, "Người mới vào vẫn kịp thi kỳ sau"). Hết ván: màn Vinh quy bái tổ 15 giây, rồi đếm ngược 15 giây sang ván mới (game tự chạy cả buổi).
- Quà KHÔNG cho lợi thế gì trong game (TikTok cấm khuyến khích tặng quà), chỉ cảm ơn.
- Một ván khoảng 11-12 phút (ước lượng, chưa đo trên live).

## File

- `src/game/thi.ts`: lõi luật chơi (không React). Test: `npx tsx src/game/thi.check.ts`.
- `src/game/config.ts`: số liệu + lời quan chủ khảo (`GAME.loi`).
- `src/game/useGame.ts`: nối sự kiện TikTok với lõi, giọng đọc. Trang stage chạy game và gửi ảnh chụp lên `/api/game/state`; trang điều khiển chỉ vẽ lại.
- `src/game/GameStage.tsx`: màn hình 1080x1920 vẽ đè lên `public/assets/bg/nen.jpg`. Toạ độ khung câu hỏi x 165-917, y 642-1059.
- `src/game/sfx.ts`: âm thanh tự tạo kiểu khoa cử (trống chầu mở kỳ, đàn tranh rải khi hiện đáp án, gảy nhỏ khi có người nộp, mõ 5 giây cuối, chiêng công bố, vuốt đàn lên/xuống đúng/không ai đúng, pháo + chiêng vinh quy) và nhạc nền ngũ cung Rê 92 BPM (nhỏ khi ông đồ nói, dồn 5 giây cuối, tắt lúc vinh quy). Bỏ mp3 cùng tên vào public/assets/sfx/ là dùng file thay.
- `src/game/GameControls.tsx`: nút "Bắt đầu ván mới", "Bỏ câu này", giả lập 1 / 60 / 500 người.
- `src/game/cau-hoi/*.txt`: 4974 câu, 14 file theo chủ đề (cách viết: `cau-hoi/HUONG-DAN.md`). Nhóm [de] [vua] [kho] [dinh] [meo]. Kiểm tra: `node tools/kiem-tra-cau-hoi.mjs`. Câu toán do `src/game/toan.ts` tự sinh. Nút "Bỏ câu này" đẩy câu xuống cuối hàng vĩnh viễn (lưu data/da-hoi.json).
- `data/da-hoi.json`: câu nào hỏi lúc nào, game ưu tiên câu lâu chưa hỏi.
- Ông đồ MC: ảnh gốc `public/assets/MC/` (nền trắng), tách nền bằng `node tools/tach-nen.mjs` ra `public/assets/nv/mc/` (mung, suy-nghi, chi, cuoi, tiec).
- Ảnh nền gốc `ai-la-trang-nguyen.png` (1536x2752, đã xoá logo sao Gemini góc phải dưới khi xuất `nen.jpg`).
- Giọng đọc: VieNeu-TTS giọng "Adam bựa" (E:_AIVieNeu-TTS, server cổng 8000, BAT-LIVE tự mở cửa sổ "Giọng VieNeu"). VieNeu tắt hoặc lỗi thì tự dùng giọng Edge NamMinh. Đổi giọng: biến VIENEU_VOICE; để trống = chỉ Edge.
- Bản này: cổng 3017 (màn hình lớn `http://localhost:3017/?view=stage`) và 3018 (điện thoại). Thử trong khung preview của Claude: thêm `&mute=1` (không phát tiếng).

## Quyết định của chủ kênh

- Tên game "Ai Là Trạng Nguyên", 20 câu, 4 kỳ: Khảo hạch trường làng, Thi Hương, Thi Hội, Thi Đình (2026-11-07).
- Ảnh nền và nhân vật ông đồ do chủ kênh vẽ (2026-11-07).
- Bộ câu hỏi bàn riêng, chưa làm (2026-11-07).
- Màn cuối ván: tiêu đề "Hiền tài là nguyên khí của quốc gia" thay chữ Vinh quy bái tổ (2026-11-07). Tam khôi dùng ảnh public/assets/top/ (tách nền ra public/assets/nv/top/), nam hay nữ cố định theo tên tài khoản.
- Ảnh nữ hạng 2 (Bảng Nhãn) và hạng 3 (Thám Hoa) chủ kênh đã vẽ lại đúng chữ, dùng đủ nam/nữ cho cả tam khôi (2026-11-07).
- Giọng quan chủ khảo: VieNeu "Adam bựa" (2026-11-07).
- Lời ông đồ có cảm xúc (thẻ [cười] [thở dài] [hắng giọng] của VieNeu), đổi theo tỉ lệ đúng: >=75% cười, <30% trêu, 0 người thở dài; đúng trong 2 giây đầu khen thần đồng. Chủ kênh duyệt (2026-11-07).
- Nam/nữ của tam khôi: người chơi gõ "nam"/"nữ" (nhớ cả buổi) > đoán theo tên tiếng Việt (src/game/gioiTinh.ts: Thị = nữ, Văn = nam, danh sách tên) > cố định theo tài khoản. Màn trao giải có avatar TikTok cạnh tên (2026-11-07).
- Bộ câu hỏi (chủ kênh chốt 2026-11-07): khán giả là người thích kiến thức; bỏ hết câu mượn của Lớp Học Chữ, viết mới; mỗi kỳ 1 câu toán máy tự sinh, khó dần; Thi Đình trộn câu khó và đố mẹo. Không dùng câu đọc lên nghe giống nhau (chính tả, dấu hỏi ngã). Đáp án ngắn (≤ 22 ký tự), lịch sử theo sách giáo khoa, không dùng chi tiết còn tranh cãi. Claude viết từng đợt, chủ kênh duyệt.
- Quà (2026-11-07): băng rôn cảm ơn đè lên biển tên game phía trên (không che câu hỏi): avatar, tên, "tặng N × món quà". Quà nhỏ 4 giây nền đỏ + tiếng đàn; quà từ 99 xu 8 giây nền vàng + pháo giấy + tiếng pháo, chen lên trước. Cùng người tặng liên tục thì gộp; hàng chờ tối đa 6. Quà KHÔNG cho lợi thế trong game. Lõi: `KyThi.tangQua`.
- Bảng vàng tuần (2026-11-07): hết mỗi ván cộng điểm vào data/bang-tuan.json (tuần tính từ thứ Hai, sang tuần mới tự làm lại; server chặn điểm 1 ván quá 20.000). Hiện top 10 lúc đếm ngược chờ ván mới; ông đồ thỉnh thoảng nhắc tên người dẫn đầu tuần.
- Màn công bố kiểu gameshow (2026-11-07): hết giờ có bước "chốt" 2,6 giây (`chotSec`): dấu đỏ HẾT GIỜ! đóng lên 4 ô, trống dồn, ông đồ "Hết giờ! Đáp án đúng là...", bảng điểm chưa lộ; rồi ô đúng nhấp nháy 4 lần (CSS .nhap-nhay) + chiêng, ông đồ đọc "B, chim sẻ!" rồi mới bình. Giữa giờ (câu từ 15 giây) ông đồ giục 1 câu (`loi.nhac`).
- Chống khoảng lặng (2026-11-07): `voice.prefetch` tạo giọng trước: câu chung (hết giờ, giục) lúc mở trang; lời công bố đáp án trong lúc người chơi trả lời; đề câu kế trong lúc công bố.
- Nhạc nền nhiều lớp (2026-11-07): nền ngân chạy suốt; chờ ván/bảng vàng vui (trống, mõ, đàn tranh); đang hỏi nhịp tim + tích tắc, sáng dần theo giờ; 5 giây cuối dồn + vút; lúc ông đồ nói nhỏ lại 45%; vinh quy tắt nhạc. `musicVolume` 0.2 trong sfx.ts (chủ kênh thấy 0.3 hơi to).
- Thi đua 3 miền (2026-11-07): gõ "Bắc" / "Trung" / "Nam" (cả "miền Bắc", "nam bộ"...) để chọn phe, nhớ cả buổi. Điểm miền = tổng điểm ván của người trong phe; hiện ở đầu bảng vàng nhỏ, bảng vàng lớn, màn vinh quy (👑 miền dẫn đầu); ông đồ đọc phe thắng cuối ván. Vì vậy lệnh chọn nhân vật đổi thành "trai" / "gái" / "con trai" / "con gái" / "nữ" ("nam" giờ là miền Nam).
- Cứu trợ bằng tim (2026-11-07): chỉ ở Thi Đình, mỗi câu cả phòng thả đủ `cuuTroTim` (200) tim trong lúc đọc đề / trả lời thì loại 2 đáp án sai (không bao giờ loại đáp án đúng), ô bị loại gạch ngang ✂️; thanh tim thay dòng "Gõ A, B, C, D" ở Thi Đình. Tim miễn phí nên không vi phạm luật quà.
- Câu nước rút (2026-11-07, đổi tên 2026-11-08): câu 20 điểm cộng và trừ đều ×2 (`latKeoNhan`), tab vàng "NƯỚC RÚT ×2", ông đồ báo trước khi đọc đề. Không dùng chữ "kèo" (tiếng lóng cá cược).
- Dấu hiệu trên tên (2026-11-07): 🏆 đầu bảng vàng tuần · 🎓 Trạng Nguyên ván trước · 🔥N đang đúng liền từ 3 câu · chấm màu phe miền (B đỏ, T vàng, N xanh).
- Ông đồ trêu / đáp bình luận vào khoảng lặng (2026-11-07, src/game/treu.ts): nhận LOẠI bình luận ngắn (khó quá, dễ quá, chào, xin gợi ý, haha, khen game) + người sai 3 câu liền, rồi nói câu soạn sẵn có chèn tên (`loi.treu`). KHÔNG đọc nguyên văn bình luận. Mỗi người 1 lần / 3 phút, cả phòng 1 câu / 12 giây, chỉ nói khi giọng rảnh lúc đang chờ trả lời (còn > 6 giây), chờ ván, bảng vàng.
- Cổ vũ + thách thức (2026-11-07): ~40% câu ông đồ thách trước khi đọc đề (`loi.thach`, `thachTiLe`); có người vượt lên dẫn đầu ván thì hô tên (`loi.dauBang`, cách ≥ 3 câu); phe miền có người mà điểm kém xa miền đầu (×1,5) thì gọi bà con miền đó (`loi.mienKem`, 5 câu 1 lần); bảng vàng sau mỗi kỳ 60% thêm câu cổ vũ người xếp sau (`loi.coVuSau`); câu giục giữa giờ thêm lời cổ vũ.
- Kết nối TikTok chép từ Lớp Học Chữ (2026-11-07): tự kết nối lại khi rớt / hết phiên / chưa live (15s, 30s, 60s, tối đa 2 phút), nhớ tài khoản trong settings.json (bật lại server là tự kết nối; bấm Ngắt kết nối thì thôi), hỏi TikTok có đang live trước khi kết nối, quá 30 giây không vào được thì báo lỗi.
- Một trang chính (2026-11-07): mỗi trang stage có mã riêng (`STAGE_ID`), server chỉ cho trang mở sau cùng làm trang chính. Trang phụ im lặng (giọng + nhạc) và KHÔNG gửi gì lên server (ảnh chụp, câu đã hỏi, bảng vàng tuần) để không cộng điểm tuần 2 lần. Đóng trang chính thì trang còn lại tự làm trang chính.
- Bảng "🎁 Gửi tặng ông đồ" (2026-11-07): nền gỗ bên trái ông đồ (x 150-630, y 1476), 4 món đại diện theo mức xu (`GAME.giftMenu`): 🌹 Hoa hồng 1 xu "Tặng ông đồ bông hoa" · 🫰 Bắn tim 5 xu "Bắn tim cho ông đồ" · 🐷 Chú heo may mắn 10 xu "Góp heo đất trường thi" · 🎆 Thả tim 100 xu "Đốt pháo mừng sĩ tử". Quà mức nào (xu 1 món) thì ông đồ đáp lời riêng của mức đó. Chỉ mời tặng cho vui, KHÔNG giục, KHÔNG hứa điểm.
- Dấu HẾT GIỜ! nằm trên hàng đồng hồ phía trên khung câu hỏi, không đè 4 ô đáp án (chủ kênh, 2026-11-07).
- Repo GitHub CÔNG KHAI từ 2026-11-07: https://github.com/workaipvlinh-byte/ai-la-trang-nguyen (MIT cho mã nguồn; ảnh thuộc tác giả). Chỉ push khi chủ kênh bảo; sửa tính năng thì cập nhật README.
- Cách nói về game: "lấy cảm hứng từ khoa cử ngày xưa", KHÔNG viết "theo không khí khoa cử" (chủ kênh, 2026-11-07).
- Bối cảnh mới "sân thi đầu làng" (2026-11-08): nền `public/assets/bg/nen2.jpg` cắt từ `nen-ver2.png` của chủ kênh (phóng 1,12 lần cho rộng rãi). Câu hỏi + 4 đáp án viết chữ phấn trên bảng đen dưới mái tranh; tên game (đổi được) treo giữa mái tranh, "CÂU x/20" bên trái; đồng hồ ở góc trên phải bảng đen; tab kỳ thi ở mép dưới trái bảng; bảng vàng top 10 dưới tán đa ngay trên tên game. Bảng "🎁 Quà tri ân" trên màn hình đã BỎ (chủ kênh, 2026-11-08); `GAME.giftMenu` vẫn giữ để ông đồ cảm ơn theo mức quà.
- Sĩ tử (2026-11-08): ai đã nộp bài được ngồi bàn (tối đa `soGhe` 31, ngồi từ hàng đầu), điểm cao ngồi các hàng giữa trước. Quay LƯNG ra khán giả (ảnh vật lưng lung-nam / lung-nu của chủ kênh), chỉ lộ nửa người trên khỏi mặt bàn, bảng tên trên đầu tự thu nhỏ chữ cho vừa (tên quá dài mới cắt). Dùng cách một hàng bàn để bảng tên hàng trước không che mặt hàng sau. Lúc công bố người đúng nhảy lên, điểm +/- bay trên đầu. Ảnh: `public/assets/nhan-vat/` → `node tools/cat-nhan-vat.mjs` → `public/assets/nv/lang/`.
- Cảnh vật (2026-11-08): ông đồ bên trái bảng đen có bảng tên (đổi được); 6 cụ: già làng + ông cầm quạt ở sân trống bên phải cạnh cột bảng, bà nón + bà cuốc mép phải, ông gậy + bà ôm gói mép trái dưới ông đồ; đám 6 đứa trẻ yếm đỏ chạy lên xuống lối giữa, mỗi đứa mang tên 1 người chưa có ghế (người thi mà hết ghế, rồi người vừa bình luận), `soTre` 6; tán đa lắc nhẹ theo gió, lá đa rơi lác đác.
- Trang điều khiển có ô sửa "Chữ trên mái tranh" và "Tên ông đồ" (lưu settings.json qua /api/cai-dat, để trống = mặc định trong config.ts). Sửa server.ts nên phải tắt bật lại BAT-LIVE mới có.
- Chính sách TikTok (chủ kênh, 2026-11-08): không dùng chữ dính cá cược ("kèo"), không "đốt pháo" (dùng "pháo hoa"), câu hỏi không có chữ tự tử / tự vẫn / tuẫn tiết, tránh chữ bạo lực nặng (chặt đầu, xử chém), không có câu quảng bá rượu (câu nói tác hại của rượu, thuốc lá thì giữ).
