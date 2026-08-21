export interface ShareCardInput {
  wins: number;
  losses: number;
  gradeLabel: string;
  modeLabel: string;
  rosterNames: string[];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawShareCard(input: ShareCardInput): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const grad = ctx.createLinearGradient(0, 0, 0, 630);
  grad.addColorStop(0, '#041018');
  grad.addColorStop(0.55, '#0a2436');
  grad.addColorStop(1, '#163a55');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 630);

  ctx.strokeStyle = 'rgba(200, 16, 46, 0.45)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(80, 315);
  ctx.lineTo(1120, 315);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(47, 111, 237, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, 180);
  ctx.lineTo(1120, 180);
  ctx.moveTo(80, 450);
  ctx.lineTo(1120, 450);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(232, 244, 255, 0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(980, 315, 88, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#d4a84b';
  ctx.font = '600 26px Oswald, Impact, sans-serif';
  ctx.fillText('NATIONAL HOCKEY LEAGUE', 72, 78);

  ctx.fillStyle = '#f4fbff';
  ctx.font = '700 110px Oswald, Impact, sans-serif';
  ctx.fillText('82-0', 72, 190);

  ctx.fillStyle = '#c9dcea';
  ctx.font = '600 28px Barlow, sans-serif';
  ctx.fillText(input.modeLabel, 72, 240);

  ctx.fillStyle = '#f4fbff';
  ctx.font = '700 96px Oswald, Impact, sans-serif';
  ctx.fillText(`${input.wins}-${input.losses}`, 72, 360);

  ctx.fillStyle = '#d4a84b';
  roundRect(ctx, 72, 390, 300, 52, 999);
  ctx.fill();
  ctx.fillStyle = '#06141f';
  ctx.font = '700 24px Oswald, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(input.gradeLabel, 222, 425);
  ctx.textAlign = 'left';

  const line = input.rosterNames.join('  ·  ');
  ctx.fillStyle = 'rgba(232, 244, 255, 0.88)';
  ctx.font = '500 22px Barlow, sans-serif';
  const maxWidth = 1050;
  if (ctx.measureText(line).width <= maxWidth) {
    ctx.fillText(line, 72, 520);
  } else {
    const mid = Math.ceil(input.rosterNames.length / 2);
    ctx.fillText(input.rosterNames.slice(0, mid).join('  ·  '), 72, 500);
    ctx.fillText(input.rosterNames.slice(mid).join('  ·  '), 72, 534);
  }

  ctx.fillStyle = 'rgba(201, 220, 234, 0.65)';
  ctx.font = '500 20px Barlow, sans-serif';
  ctx.fillText('Can you go 82-0?', 72, 590);

  return canvas;
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}
