import { useEffect, useState } from 'react';
import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { voice } from './live/voice';
import { sfx } from './game/sfx';
import { useGame } from './game/useGame';
import { GameStage } from './game/GameStage';
import { GameControls } from './game/GameControls';
import { KhungQr, useQr } from './game/KhungQr';
import { STAGE_H, STAGE_W } from './live/page';

/** Cỡ cửa sổ, để chia chỗ cho khung QR bên cạnh sân thi */
function useCuaSo() {
  const [c, setC] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const doi = () => setC({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', doi);
    return () => window.removeEventListener('resize', doi);
  }, []);
  return c;
}

export default function App() {
  const game = useGame();
  const [blocked, setBlocked] = useState(false);
  const qr = useQr();
  const cuaSo = useCuaSo();
  useEffect(() => {
    voice.onBlocked = () => setBlocked(true);
  }, []);

  // Trang cho TikTok LIVE Studio: chỉ có màn hình game
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: 'radial-gradient(ellipse at 30% 50%,#5a2410 0%,#1e0c04 75%)' }} onClick={() => {
          setBlocked(false);
          sfx.resume();
        }}>
        {/* bản quét QR: màn hình ngang thì QR to bên trái sân thi; màn hình dọc thì QR nhỏ ở góc trên */}
        {(() => {
          const sanRong = (cuaSo.h * STAGE_W) / STAGE_H;
          const qrRong = Math.min(cuaSo.w - sanRong, cuaSo.w * 0.45);
          const soSiTu = game.view?.soSiTu ?? 0;
          if (qrRong >= 300)
            return (
              <>
                <KhungQr qr={qr} soSiTu={soSiTu} rong={qrRong} />
                <StageFrame maxWidth={cuaSo.w - qrRong}>
                  <GameStage game={game} />
                </StageFrame>
              </>
            );
          return (
            <>
              <StageFrame>
                <GameStage game={game} />
              </StageFrame>
              {qr?.svg && (
                <div className="fixed left-2 top-2 z-40 w-[22vw] max-w-[180px] rounded-lg bg-white p-1 shadow-xl">
                  <div className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr.svg }} />
                  <div className="text-center text-[11px] font-bold text-[#3a1a0b]">Quét để vào thi</div>
                </div>
              )}
            </>
          );
        })()}
        {/* Chrome chặn tiếng tới khi bấm vào trang. LIVE Studio không chặn nên nút này không hiện trên live. */}
        {blocked && (
          <button className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-amber-500 px-8 py-4 text-2xl font-bold text-white shadow-2xl">
            🔊 Bấm vào đây để bật tiếng
          </button>
        )}
      </div>
    );
  }

  // Trang điều khiển
  return (
    <Dashboard
      status={game.status}
      channelName={game.channelName}
      extra={<GameControls />}
      preview={
        <StageFrame maxHeight={720}>
          <GameStage game={game} />
        </StageFrame>
      }
    />
  );
}
