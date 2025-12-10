export interface CoverPreset {
  id: string;
  name: string;
  url: string; // data url
}

export const generateCoverPresets = (): CoverPreset[] => {
  const presets: CoverPreset[] = [];

  // Helper to create canvas and get data URL
  // We use a decent resolution for PDF print quality
  const createPattern = (drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; 
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if(ctx) drawFn(ctx, 600, 800);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // 1. Space/Stars
  presets.push({
    id: 'space',
    name: 'Cosmic',
    url: createPattern((ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#4338ca');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,w,h);
        ctx.fillStyle = '#ffffff';
        for(let i=0; i<150; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = Math.random() * 2;
            ctx.globalAlpha = Math.random();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI*2);
            ctx.fill();
        }
    })
  });

  // 2. Rainbow Fun
  presets.push({
    id: 'rainbow',
    name: 'Rainbow',
    url: createPattern((ctx, w, h) => {
        const colors = ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#93c5fd', '#a5b4fc', '#d8b4fe'];
        // Draw diagonal stripes
        const stripeWidth = 100;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0,0,w,h);
        
        ctx.rotate(45 * Math.PI / 180);
        for(let i = -10; i < 20; i++) {
             ctx.fillStyle = colors[Math.abs(i) % colors.length];
             ctx.fillRect(i * stripeWidth, -500, stripeWidth, h + 1000);
        }
    })
  });

   // 3. Doodle Patterns
  presets.push({
    id: 'doodle',
    name: 'Doodles',
    url: createPattern((ctx, w, h) => {
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(0,0,w,h);
        
        const colors = ['#0ea5e9', '#f43f5e', '#8b5cf6'];
        ctx.lineWidth = 3;
        
        for(let i=0; i<30; i++) {
            ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
            const x = Math.random() * w;
            const y = Math.random() * h;
            const size = 30 + Math.random() * 40;
            
            // Draw random circles and squares
            ctx.beginPath();
            if (Math.random() > 0.5) {
                ctx.arc(x, y, size/2, 0, Math.PI*2);
            } else {
                ctx.rect(x - size/2, y - size/2, size, size);
            }
            ctx.stroke();
        }
    })
  });

  return presets;
}
