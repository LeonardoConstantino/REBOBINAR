import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { generatePosterData } from '../../content/posters';
import { MODES } from '../../content/modes';
import { Download, Share2, X } from 'lucide-react';

export const PosterModal: React.FC = () => {
  const { activeModal, closeModal, mode, distanceMeters, takesCount, lastRunStats } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canShare, setCanShare] = useState<boolean>(false);

  const stats = lastRunStats || {
    mode,
    seed: 198402,
    distanceMeters: Math.floor(distanceMeters),
    ticks: 1200,
    timeSeconds: 20,
    takesCount: takesCount,
    keyframesCrossed: Math.floor(distanceMeters / 100),
    retakesUsed: 0,
    powerupsCollected: 0,
  };

  const poster = generatePosterData(stats);
  const modeConfig = MODES[stats.mode];

  useEffect(() => {
    setCanShare(!!navigator.share);
  }, []);

  useEffect(() => {
    if (activeModal !== 'poster') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Poster Resolution 600x900 (2:3 aspect ratio)
    canvas.width = 600;
    canvas.height = 900;

    // Background: Deep cinema dark with warm vignette
    ctx.fillStyle = '#17191D';
    ctx.fillRect(0, 0, 600, 900);

    const grad = ctx.createRadialGradient(300, 450, 100, 300, 450, 450);
    grad.addColorStop(0, '#222730');
    grad.addColorStop(1, '#111317');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 900);

    // Border Frame
    ctx.strokeStyle = '#D69A45';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, 552, 852);

    ctx.strokeStyle = '#E8DFC9';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, 536, 836);

    // Film Sprockets along borders
    ctx.fillStyle = '#E8DFC9';
    for (let y = 44; y < 860; y += 24) {
      ctx.fillRect(26, y, 4, 8);
      ctx.fillRect(570, y, 4, 8);
    }

    // Festival Laurels & Rating
    ctx.fillStyle = '#D69A45';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELEÇÃO OFICIAL — FESTIVAL DA PELÍCULA REBOBINADA', 300, 70);

    // Dynamic Title
    ctx.fillStyle = '#E8DFC9';
    ctx.font = 'bold 38px "Bebas Neue", sans-serif';
    ctx.fillText(poster.title.toUpperCase(), 300, 150);

    // Subtitle / Mode
    ctx.fillStyle = modeConfig.paletteAccent;
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(`[ ${modeConfig.name.toUpperCase()} ]`, 300, 185);

    // Central Art: Stylized Cracked Clapper & Protagonist silhouette
    ctx.save();
    ctx.translate(300, 360);

    // Giant Clapperboard
    ctx.fillStyle = '#1E232B';
    ctx.strokeStyle = '#D69A45';
    ctx.lineWidth = 4;
    ctx.fillRect(-120, -90, 240, 170);
    ctx.strokeRect(-120, -90, 240, 170);

    // Stripes on clapper stick
    ctx.fillStyle = '#E8DFC9';
    ctx.fillRect(-120, -115, 240, 25);
    ctx.fillStyle = '#17191D';
    for (let x = -100; x < 120; x += 40) {
      ctx.fillRect(x, -115, 20, 25);
    }

    // Big Tomada count
    ctx.fillStyle = '#D94B43';
    ctx.font = 'bold 54px "Bebas Neue", sans-serif';
    ctx.fillText(`TOMADA ×${stats.takesCount}`, 0, 15);

    // Distance
    ctx.fillStyle = '#E8DFC9';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.floor(stats.distanceMeters)} METROS PERCORRIDOS`, 0, 55);

    ctx.restore();

    // Fake Review Quote
    ctx.fillStyle = '#E8DFC9';
    ctx.font = 'italic 16px "Space Grotesk", sans-serif';
    ctx.fillText(`"${poster.reviewQuote}"`, 300, 560);

    ctx.fillStyle = '#D69A45';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`— ${poster.reviewAuthor}`, 300, 595);

    ctx.fillStyle = '#D69A45';
    ctx.font = '24px "Space Grotesk", sans-serif';
    ctx.fillText(poster.rating, 300, 635);

    // Credits Block (Cinema Billing Block)
    ctx.fillStyle = '#E8DFC9';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText('DIREÇÃO: VOCÊ   ROTEIRO: O DESTINO   MONTAGEM: FINAL CUT PRESSURE', 300, 720);
    ctx.fillText('FOTOGRAFIA: 35MM PROCEDURAL   FIGURINO: UNRULY EXTRAS   TRILHA: RUÍDO DE PROJETOR', 300, 740);
    ctx.fillText(`CLASSIFICAÇÃO: ${poster.classification} — DISTRIBUIÇÃO: REBOBINAR INDIE STUDIOS`, 300, 765);

    // Bottom Logo
    ctx.fillStyle = '#D69A45';
    ctx.font = 'bold 28px "Bebas Neue", sans-serif';
    ctx.fillText('REBOBINAR', 300, 830);
  }, [activeModal, stats, modeConfig, poster]);

  if (activeModal !== 'poster') return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebobinar-cartaz-tomada-${stats.takesCount}.png`;
    a.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !navigator.share) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'cartaz-rebobinar.png', { type: 'image/png' });
        await navigator.share({
          title: 'REBOBINAR — Cartaz do Filme',
          text: `Cheguei a ${Math.floor(stats.distanceMeters)}m após ${stats.takesCount} tomadas no REBOBINAR!`,
          files: [file],
        });
      });
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm pointer-events-auto select-none">
      <div className="relative bg-[#17191D] border-2 border-[#D69A45] rounded-lg p-5 max-w-lg w-full max-h-[92vh] flex flex-col items-center overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 p-1.5 bg-[#2A2E35] text-[#E8DFC9] hover:text-white rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-display text-3xl tracking-wider text-[#D69A45] mb-3">
          CARTAZ DO SEU FILME
        </h2>

        {/* Poster Canvas Preview */}
        <div className="w-full max-w-[320px] aspect-[2/3] shadow-2xl rounded border border-[#E8DFC9]/20 overflow-hidden bg-black">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4 w-full max-w-[320px]">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#D69A45] hover:bg-[#e4a852] text-[#17191D] font-mono-film font-bold text-xs rounded transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            BAIXAR CARTAZ
          </button>

          {canShare && (
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#42BFC2] hover:bg-[#52d0d3] text-[#17191D] font-mono-film font-bold text-xs rounded transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              COMPARTILHAR
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
