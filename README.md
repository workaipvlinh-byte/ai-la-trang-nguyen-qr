# Ai Là Trạng Nguyên, bản quét mã QR

Game show đố vui lấy cảm hứng từ khoa cử ngày xưa, cả nhóm chơi chung trên một màn hình lớn. Một máy tính mở trường thi, mọi người quét mã QR bằng điện thoại để vào thi, ngồi cùng phòng hay ở xa đều được. Hợp cho lớp học, buổi họp lớp, sự kiện, hay bạn bè tụ tập.

Ông đồ đọc câu hỏi và 4 đáp án, người chơi bấm A, B, C hoặc D ngay trên điện thoại. Mỗi ván 20 câu qua 4 kỳ thi: khảo hạch trường làng, thi Hương, thi Hội, thi Đình. Hết ván, ba người cao điểm nhất đỗ Trạng Nguyên, Bảng Nhãn, Thám Hoa.

Bản này tách ra từ [Ai Là Trạng Nguyên cho TikTok LIVE](https://github.com/workaipvlinh-byte/ai-la-trang-nguyen) và không cần TikTok.

## Tải về và chạy

Không phải cài gì, gói đã có sẵn mọi thứ để chạy.

1. Tải file **TrangNguyen-QR.zip** ở mục [Releases](https://github.com/workaipvlinh-byte/ai-la-trang-nguyen-qr/releases/latest) (khoảng 65 MB).
2. Chuột phải vào file zip, chọn **Extract All**, giải nén ra thư mục có đường dẫn ngắn, ví dụ `C:\TrangNguyen`. Đừng để trong Desktop, Downloads hay Documents.
3. Mở thư mục đó, bấm đúp **MO-TRUONG-THI.bat**.
4. Windows hiện bảng xanh "Windows protected your PC" thì bấm **More info**, rồi bấm **Run anyway**.
5. Windows hỏi có cho Node.js dùng mạng không thì tick cả hai ô rồi bấm **Allow access**.
6. Khoảng 10 đến 20 giây sau, trình duyệt tự mở màn hình trường thi, mã QR nằm bên trái. Bấm vào màn hình một lần để bật tiếng.
7. Để cửa sổ đen mở suốt buổi chơi. Đóng nó là tắt game.

Cần máy tính Windows 10 hoặc 11 bản 64-bit, có internet. Muốn chiếu lên màn hình lớn thì cắm máy vào TV hoặc máy chiếu, bấm F11 cho toàn màn hình.

## Người chơi làm gì

1. Mở camera điện thoại, quét mã QR trên màn hình. Ai không quét được thì gõ địa chỉ in dưới mã QR.
2. Nhập tên, chọn đội Đỏ, Vàng hoặc Xanh.
3. Ông đồ đọc xong đề thì bấm đáp án. Đúng càng nhanh điểm càng cao, sai bị trừ.

Không phải cài app, điện thoại nào có trình duyệt là chơi được. Trên điện thoại có điểm và hạng của mình, đúng hay sai sau mỗi câu, mấy nút cảm xúc (Khó quá, Dễ ợt, Haha, Hay quá) để ông đồ trêu lại, và nút thả tim ở thi Đình.

## Game có gì

- Gần 5.000 câu hỏi tiếng Việt, 14 chủ đề: lịch sử, địa lý, văn học, ca dao tục ngữ, khoa học, sức khoẻ, động thực vật, văn hoá ẩm thực, thế giới, phát minh, nghệ thuật, thể thao, khoa cử và danh nhân, đố mẹo. Câu khó dần theo kỳ thi, mỗi kỳ thêm một câu toán nhẩm máy tự ra.
- Sân thi đầu làng: đề viết phấn lên bảng đen dưới mái tranh. Ai nộp bài được ngồi một bàn có tên mình, chưa có ghế thì tên chạy theo đám trẻ con giữa sân. Các cụ ngồi hai bên xem, cây đa đung đưa, lá rơi lác đác.
- Thi đua ba đội Đỏ, Vàng, Xanh, điểm cả đội cộng dồn.
- Cứu trợ bằng tim: ở thi Đình, cả phòng thả đủ tim thì ông đồ loại 2 đáp án sai.
- Bảng vàng sau mỗi kỳ. Câu cuối ván điểm nhân đôi.
- Ông đồ biết nói chuyện: đọc đề, công bố đáp án có lúc cười có lúc thở dài, gọi tên người vừa vượt lên dẫn đầu, trêu người than khó.
- Âm thanh tự tạo: nhạc nền đàn tranh, trống dồn lúc hết giờ, chiêng lúc công bố. Không dùng nhạc có bản quyền.
- Hết ván tự sang ván mới, chạy được cả buổi.

## Ở xa vào được bằng cách nào

Game dùng đường hầm miễn phí của Cloudflare (bản nhanh, không cần tài khoản) để có một địa chỉ web công khai, nên ở đâu quét mã cũng vào được. Mỗi lần mở game, địa chỉ và mã QR lại đổi mới.

Đường vào này chỉ mở trang chơi. Trang điều khiển (bắt đầu ván mới, bỏ câu, đổi tên game) chỉ chính máy chủ mở được, người lạ không đụng tới.

Cloudflare nói bản nhanh dùng để thử nghiệm, không cam kết lúc nào cũng chạy. Một lớp học hay một nhóm vài chục người thì đủ dùng. Máy mất mạng thì mã QR tự đổi sang địa chỉ Wi-Fi nội bộ, khi đó chỉ điện thoại dùng chung Wi-Fi vào được.

## Gặp lỗi thì sao

- Cửa sổ đen báo đang mở trong file zip: bạn bấm thẳng trong file zip. Giải nén ra thư mục rồi bấm lại.
- Cửa sổ đen có chữ EADDRINUSE: game đang mở ở một cửa sổ khác. Đóng cửa sổ đó rồi bấm lại.
- Dưới mã QR báo "Chỉ điện thoại dùng chung Wi-Fi...": máy chưa mở được đường vào từ xa, thường do mất mạng. Có mạng lại thì tắt game rồi mở lại.
- Điện thoại dùng chung Wi-Fi mà không vào được: Wi-Fi trường học, quán cà phê hay chặn các máy nói chuyện với nhau. Cho máy tính dùng mạng có internet là được.
- Gặp câu hỏi sai: bấm "Bỏ câu này" ở trang điều khiển. Bộ câu do AI viết rồi soát lại, gần 5.000 câu nên khó tránh sót vài câu.

## Cho người biết code

- Node.js + TypeScript. Server `server.ts` (Express), giao diện React 19 + Vite + Tailwind 4.
- Cổng 3017: màn hình lớn và trang điều khiển, chỉ nghe `127.0.0.1`. Cổng 3018: trang điện thoại (`phone/index.html`, `choi.ts`), chỉ có trang chơi và vài API.
- Điện thoại bấm nút thì server đổi thành sự kiện bình luận giả, nên lõi luật chơi dùng chung với bản TikTok (`src/game/thi.ts`, kiểm tra bằng `npx tsx src/game/thi.check.ts`).
- Đường hầm: `duong-ham.ts` chạy `bin/cloudflared.exe`. Đường hầm bản nhanh không hỗ trợ SSE nên điện thoại hỏi trạng thái mỗi giây.
- Chạy thử khi sửa code: `npm install`, tải `cloudflared-windows-amd64.exe` từ trang [cloudflared](https://github.com/cloudflare/cloudflared/releases) về `bin/cloudflared.exe`, rồi `npm run dev`.
- Đóng gói zip: `npm run dong-goi` (tự tải Node.js 24 LTS và kiểm mã băm).

## Giấy phép

Mã nguồn dùng giấy phép [MIT](LICENSE). Ảnh ông đồ, ảnh tam khôi, ảnh nhân vật và ảnh nền (`public/assets/`, `ai-la-trang-nguyen.png`) thuộc về tác giả. Muốn dùng cho việc của mình thì nên thay bằng ảnh riêng.

Gói zip có kèm Node.js (giấy phép Node.js) và cloudflared (Apache 2.0). Giấy phép của hai phần mềm này nằm trong thư mục `giay-phep`.

Game lấy cảm hứng từ các game show đố vui trên truyền hình nhưng không dùng tên, giao diện, nhạc hay câu thoại của chương trình nào.
