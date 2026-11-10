import { useEffect, useState } from 'react';

type Qr = { url: string; svg: string; chiWifi: boolean; duongHam: { trang: string; loi: string } };

/** Lấy địa chỉ cho người chơi + mã QR từ server (đường hầm mở lại thì địa chỉ đổi, nên hỏi lại mỗi 5 giây) */
export function useQr() {
  const [qr, setQr] = useState<Qr | null>(null);
  useEffect(() => {
    let tat = false;
    const hoi = () =>
      fetch('/api/qr')
        .then((r) => r.json())
        .then((x) => !tat && setQr(x))
        .catch(() => {});
    hoi();
    const t = setInterval(hoi, 5000);
    return () => ((tat = true), clearInterval(t));
  }, []);
  return qr;
}

/** Khung QR bên cạnh sân thi (màn hình nằm ngang: TV, máy chiếu, laptop) */
export function KhungQr({ qr, soSiTu, rong }: { qr: Qr | null; soSiTu: number; rong: number }) {
  const dangMo = qr?.duongHam.trang === 'dang-mo';
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[2.2vh] px-[2vw] text-center" style={{ width: rong, color: '#fbf0d6' }}>
      <div className="text-[4.2vh] font-extrabold leading-tight" style={{ color: '#ffd977', textShadow: '0 3px 0 #3a0d05' }}>
        🏮 Quét mã để vào thi
      </div>
      <div className="aspect-square w-full max-w-[46vh] rounded-[2vh] border-[0.6vh] bg-white p-[1.4vh]" style={{ borderColor: '#d9a441' }}>
        {qr?.svg ? (
          <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr.svg }} />
        ) : (
          <div className="grid h-full place-items-center text-[2.4vh] font-bold text-[#3a1a0b]">Đang tạo mã…</div>
        )}
      </div>
      {qr?.url && <div className="max-w-full break-all text-[2vh] font-semibold opacity-80">{qr.url.replace(/^https?:\/\//, '')}</div>}
      {qr?.chiWifi && (
        <div className="rounded-[1.4vh] px-[1.4vh] py-[0.8vh] text-[2vh] font-bold" style={{ background: 'rgba(200,16,46,.35)' }}>
          {dangMo ? 'Đang mở đường vào từ xa… Tạm thời chỉ máy cùng Wi-Fi vào được' : 'Chỉ điện thoại dùng chung Wi-Fi với máy này vào được'}
        </div>
      )}
      <ol className="space-y-[0.6vh] text-left text-[2.4vh] font-semibold">
        <li>1. Mở camera hoặc Zalo, quét mã</li>
        <li>2. Nhập tên, chọn đội</li>
        <li>3. Bấm đáp án ngay trên điện thoại</li>
      </ol>
      <div className="text-[2.6vh] font-extrabold" style={{ color: '#ffd977' }}>{soSiTu} sĩ tử đã nộp bài</div>
      <a href="/" target="_blank" rel="noreferrer" className="text-[1.8vh] underline opacity-60">Mở trang điều khiển</a>
    </div>
  );
}
