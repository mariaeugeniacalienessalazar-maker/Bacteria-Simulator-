
import React, { useRef, useEffect } from 'react';

const Background3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Microorganism Generator
    const particles: { 
        x: number; 
        y: number; 
        vx: number; 
        vy: number; 
        size: number; 
        color: string; 
        type: 'bubble' | 'amoeba' | 'rod';
        angle: number;
    }[] = [];

    const numParticles = 80;
    
    // GREEN / BIOLOGICAL PALETTE
    const colors = ['rgba(100, 255, 100, 0.4)', 'rgba(200, 255, 50, 0.3)', 'rgba(50, 255, 150, 0.5)', 'rgba(200, 255, 200, 0.3)'];

    for (let i = 0; i < numParticles; i++) {
      const typeRand = Math.random();
      let type: 'bubble' | 'amoeba' | 'rod' = 'bubble';
      if (typeRand > 0.7) type = 'amoeba';
      else if (typeRand > 0.4) type = 'rod';

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2, // Slow movement
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 15 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: type,
        angle: Math.random() * Math.PI * 2
      });
    }

    let animationFrameId: number;
    let time = 0;

    const draw = () => {
      if (!ctx) return;
      time += 0.005;

      // 1. Clear background to DARK GREENISH
      ctx.fillStyle = '#051005';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Microscope Light (Lens effect)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.6; // Large circle

      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
      gradient.addColorStop(0, '#e8f5e9'); // Bright center
      gradient.addColorStop(0.7, '#66bb6a'); // Green
      gradient.addColorStop(0.9, '#1b5e20'); // Dark Green
      gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Fade out

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.clip(); // Clip everything inside the lens

      // 3. Draw Particles inside the lens
      particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.angle += 0.01;

          // Wrap around logic
          if (p.x < centerX - radius) p.x = centerX + radius;
          if (p.x > centerX + radius) p.x = centerX - radius;
          if (p.y < centerY - radius) p.y = centerY + radius;
          if (p.y > centerY + radius) p.y = centerY - radius;

          ctx.fillStyle = p.color;
          ctx.beginPath();

          if (p.type === 'bubble') {
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              // Shine
              ctx.fillStyle = 'rgba(255,255,255,0.8)';
              ctx.beginPath();
              ctx.arc(p.x - p.size*0.3, p.y - p.size*0.3, p.size*0.2, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = p.color; // restore
          } else if (p.type === 'rod') {
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(p.angle);
              ctx.roundRect(-p.size*2, -p.size/2, p.size*4, p.size, p.size/2);
              ctx.fill();
              ctx.restore();
          } else if (p.type === 'amoeba') {
              const wobble = Math.sin(time * 2 + p.x) * 3;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size + Math.abs(wobble) + 5, 0, Math.PI * 2);
              ctx.fill();
              // Nucleus
              ctx.fillStyle = 'rgba(0,0,0,0.3)';
              ctx.beginPath();
              ctx.arc(p.x + wobble, p.y, p.size * 0.4, 0, Math.PI * 2);
              ctx.fill();
          }
      });
      
      // 4. Subtle Texture Overlay (Noise)
      ctx.fillStyle = 'rgba(0,50,0,0.05)';
      ctx.fillRect(0,0,width,height);

      ctx.restore(); // Remove clip

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full -z-10" />;
};

export default Background3D;
