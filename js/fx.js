/**
 * fx.js - Efeitos Visuais de Celebração: Confetes 3D e Fogos de Artifício (Canvas nativo)
 */

class VisualEffects {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.confettiParticles = [];
    this.fireworkRockets = [];
    this.fireworkParticles = [];
    this.isRunning = false;
    this.colors = [
      '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6',
      '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6',
      '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316'
    ];
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  celebrate() {
    this.resize();
    this.confettiParticles = [];
    this.fireworkRockets = [];
    this.fireworkParticles = [];

    // Lança salva de confetes
    this.spawnConfettiBurst(window.innerWidth * 0.5, window.innerHeight * 0.4, 180);
    this.spawnConfettiBurst(window.innerWidth * 0.25, window.innerHeight * 0.6, 90);
    this.spawnConfettiBurst(window.innerWidth * 0.75, window.innerHeight * 0.6, 90);

    // Lança salva de fogos de artifício
    this.launchFirework(window.innerWidth * 0.3, window.innerHeight * 0.25);
    this.launchFirework(window.innerWidth * 0.7, window.innerHeight * 0.22);
    setTimeout(() => {
      this.launchFirework(window.innerWidth * 0.5, window.innerHeight * 0.18);
      this.launchFirework(window.innerWidth * 0.2, window.innerHeight * 0.3);
      this.launchFirework(window.innerWidth * 0.8, window.innerHeight * 0.28);
    }, 400);

    setTimeout(() => {
      this.launchFirework(window.innerWidth * 0.4, window.innerHeight * 0.2);
      this.launchFirework(window.innerWidth * 0.6, window.innerHeight * 0.24);
    }, 900);

    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }
  }

  spawnConfettiBurst(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 6;
      this.confettiParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: Math.random() * 9 + 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        tilt: Math.random() * 10,
        tiltSpeed: Math.random() * 0.12 + 0.05,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 120 + 140
      });
    }
  }

  launchFirework(targetX, targetY) {
    const startX = targetX + (Math.random() * 60 - 30);
    const startY = window.innerHeight;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy);
    const speed = 15 + Math.random() * 4;
    const angle = Math.atan2(dy, dx);

    this.fireworkRockets.push({
      x: startX,
      y: startY,
      targetY: targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      trail: []
    });
  }

  explodeFirework(x, y, color) {
    const particleCount = 75;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 6 + 2;
      this.fireworkParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.012,
        radius: Math.random() * 2.5 + 1.5,
        gravity: 0.09
      });
    }
  }

  loop() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Atualiza e desenha fogos em subida
    for (let i = this.fireworkRockets.length - 1; i >= 0; i--) {
      const rocket = this.fireworkRockets[i];
      rocket.trail.push({ x: rocket.x, y: rocket.y });
      if (rocket.trail.length > 6) rocket.trail.shift();

      rocket.x += rocket.vx;
      rocket.y += rocket.vy;
      rocket.vy += 0.15; // gravidade leve

      // Desenha rastro
      this.ctx.beginPath();
      this.ctx.strokeStyle = rocket.color;
      this.ctx.lineWidth = 3;
      if (rocket.trail.length > 1) {
        this.ctx.moveTo(rocket.trail[0].x, rocket.trail[0].y);
        for (let t = 1; t < rocket.trail.length; t++) {
          this.ctx.lineTo(rocket.trail[t].x, rocket.trail[t].y);
        }
      }
      this.ctx.stroke();

      if (rocket.y <= rocket.targetY || rocket.vy >= 0) {
        this.explodeFirework(rocket.x, rocket.y, rocket.color);
        this.fireworkRockets.splice(i, 1);
      }
    }

    // 2. Atualiza e desenha partículas dos fogos explodidos
    for (let i = this.fireworkParticles.length - 1; i >= 0; i--) {
      const p = this.fireworkParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.fireworkParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 3. Atualiza e desenha confetes
    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const c = this.confettiParticles[i];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.28; // gravidade
      c.vx *= 0.985;
      c.vy *= 0.985;
      c.rotation += c.rotationSpeed;
      c.tilt += c.tiltSpeed;
      c.life++;

      if (c.life > c.maxLife - 30) {
        c.opacity = Math.max(0, (c.maxLife - c.life) / 30);
      }

      if (c.life >= c.maxLife || c.y > this.canvas.height + 20) {
        this.confettiParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate((c.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = c.opacity;
      this.ctx.fillStyle = c.color;

      const scaleX = Math.cos(c.tilt);
      this.ctx.fillRect(-c.size / 2, (-c.size * scaleX) / 2, c.size, c.size * scaleX);
      this.ctx.restore();
    }

    if (this.confettiParticles.length === 0 && this.fireworkRockets.length === 0 && this.fireworkParticles.length === 0) {
      this.isRunning = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.isRunning = false;
    this.confettiParticles = [];
    this.fireworkRockets = [];
    this.fireworkParticles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

export const FX = new VisualEffects();
