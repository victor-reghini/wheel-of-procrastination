/**
 * wheel.js - Motor da Roleta Anti-Procrastinação
 * Renderização em Canvas 2D de alta densidade, proporções dinâmicas (Prioridade/Dificuldade),
 * física de rotação suave, colisão do ponteiro com som de catraca e efeito de zoom cinemático.
 */

import { Sound } from './sound.js';

export class WheelOfProcrastination {
  constructor(canvas, container, options = {}) {
    this.canvas = canvas;
    this.container = container;
    this.ctx = canvas.getContext('2d');

    this.tasks = [];
    this.slices = []; // { task, weight, startAngle, endAngle, percent }
    this.totalWeight = 0;

    // Estado físico
    this.rotation = 0; // Ângulo atual em radianos
    this.angularVelocity = 0;
    this.isSpinning = false;
    this.spinStartTime = 0;
    this.spinDuration = 5500; // 5.5s
    this.initialAngle = 0;
    this.targetAngle = 0;

    // Flipper / Ponteiro (topo da roleta = -PI/2)
    this.pointerAngle = -Math.PI / 2;
    this.lastCrossedSliceIndex = -1;
    this.flipperDeflection = 0;

    // Zoom cinemático
    this.zoomScale = 1.0;
    this.targetZoomScale = 1.0;
    this.isZooming = false;

    // Callbacks
    this.onSpinStart = options.onSpinStart || (() => {});
    this.onSpinEnd = options.onSpinEnd || (() => {});

    this.initCanvas();
    window.addEventListener('resize', () => this.resize());
  }

  initCanvas() {
    this.resize();
    this.render();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width || 420, rect.height || 420);

    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.scale(dpr, dpr);

    this.size = size;
    this.radius = (size / 2) - 16;
    this.centerX = size / 2;
    this.centerY = size / 2;

    this.render();
  }

  setTasks(tasks) {
    this.tasks = tasks.filter(t => t.enabled !== false);
    this.calculateSlices();
    this.render();
  }

  /**
   * Cálculo das fatias proporcionais:
   * Peso = Prioridade / Dificuldade
   * - Prioridade alta (ex: 5) + Dificuldade baixa (ex: 1) = Peso 5.0 (fatia enorme, fácil de vencer!)
   * - Prioridade baixa (ex: 1) + Dificuldade alta (ex: 5) = Peso 0.2 (fatia minúscula)
   */
  calculateSlices() {
    if (!this.tasks || this.tasks.length === 0) {
      this.slices = [];
      this.totalWeight = 0;
      return;
    }

    const calculated = this.tasks.map(task => {
      const p = Math.max(1, Math.min(5, Number(task.priority) || 3));
      const d = Math.max(1, Math.min(5, Number(task.difficulty) || 3));
      // Peso = P / D
      const weight = p / d;
      return { task, weight, p, d };
    });

    this.totalWeight = calculated.reduce((sum, item) => sum + item.weight, 0);

    let currentAngle = 0;
    this.slices = calculated.map(item => {
      const sliceAngle = (item.weight / this.totalWeight) * (Math.PI * 2);
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const percent = (item.weight / this.totalWeight) * 100;
      currentAngle = endAngle;

      return {
        task: item.task,
        weight: item.weight,
        startAngle,
        endAngle,
        percent,
        color: item.task.color || '#3b82f6'
      };
    });
  }

  getSliceWeights() {
    return this.slices.map(s => ({
      id: s.task.id,
      title: s.task.title,
      weight: s.weight,
      percent: s.percent
    }));
  }

  /**
   * Dispara o giro da roleta
   */
  spin() {
    if (this.isSpinning || this.slices.length === 0) return false;

    this.isSpinning = true;
    this.spinStartTime = performance.now();
    this.initialAngle = this.rotation % (Math.PI * 2);

    // Número de voltas completas aleatórias (6 a 9 voltas) + ângulo de destino
    const extraTurns = (Math.PI * 2) * (6 + Math.random() * 3);
    const randomStopAngle = Math.random() * Math.PI * 2;
    this.targetAngle = this.initialAngle + extraTurns + randomStopAngle;

    // Reset de zoom
    this.setZoom(1.0);

    this.onSpinStart();
    this.animate();
    return true;
  }

  setZoom(scale, focusYOffset = 0) {
    this.zoomScale = scale;
    if (this.container) {
      // Aplica transformação com origem perto do ponteiro (topo centro)
      this.container.style.transformOrigin = '50% 28%';
      this.container.style.transform = `scale(${scale}) translateY(${focusYOffset}px)`;
    }
  }

  resetZoom() {
    if (this.container) {
      this.container.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      this.setZoom(1.0, 0);
    }
  }

  /**
   * Loop de animação de rotação com física e easing exponencial
   */
  animate() {
    if (!this.isSpinning) return;

    const now = performance.now();
    const elapsed = now - this.spinStartTime;
    const progress = Math.min(1, elapsed / this.spinDuration);

    // Easing Out Quintic para desaceleração realista e dramática
    const ease = 1 - Math.pow(1 - progress, 4.8);
    this.rotation = this.initialAngle + (this.targetAngle - this.initialAngle) * ease;

    // Detecção de colisão do ponteiro com divisores das fatias
    this.checkPointerCollision(progress);

    // Efeito de ZOOM CINEMÁTICO:
    // À medida que a roleta desacelera (últimos 45% do tempo), dá zoom no ponteiro/item sorteado!
    if (progress > 0.55) {
      const zoomProgress = (progress - 0.55) / 0.45;
      // Easing suave para o zoom
      const zoomEase = 1 - Math.pow(1 - zoomProgress, 2);
      // Zoom mais perceptível no mobile (até 1.45x) e suave no desktop (até 1.25x)
      const isMobile = window.innerWidth <= 768;
      const maxZoom = isMobile ? 1.42 : 1.25;
      const currentZoom = 1.0 + (maxZoom - 1.0) * zoomEase;
      const yShift = (isMobile ? 18 : 10) * zoomEase;

      if (this.container) {
        this.container.style.transition = 'none';
        this.setZoom(currentZoom, yShift);
      }
    }

    this.render();

    if (progress < 1) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.isSpinning = false;
      this.flipperDeflection = 0;
      this.render();

      const winner = this.getCurrentWinner();
      // Segura o zoom por 650ms para visualização dramática do item sorteado antes de abrir o modal
      setTimeout(() => {
        this.onSpinEnd(winner);
      }, 650);
    }
  }

  /**
   * Verifica qual fatia está sob o ponteiro e produz o clique de catraca
   */
  checkPointerCollision(progress) {
    if (this.slices.length === 0) return;

    // Ponteiro está fixo no topo (-PI/2 radianos)
    // Para achar a fatia correspondente na roleta girada:
    // angleOnWheel = (pointerAngle - rotation) mod 2PI
    let angleOnWheel = (this.pointerAngle - (this.rotation % (Math.PI * 2))) % (Math.PI * 2);
    if (angleOnWheel < 0) angleOnWheel += Math.PI * 2;

    let currentIndex = -1;
    for (let i = 0; i < this.slices.length; i++) {
      const s = this.slices[i];
      if (angleOnWheel >= s.startAngle && angleOnWheel < s.endAngle) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex !== -1 && currentIndex !== this.lastCrossedSliceIndex) {
      this.lastCrossedSliceIndex = currentIndex;
      // Velocidade proporcional ao restante da animação
      const speedFactor = 1 - progress;
      Sound.playTick(speedFactor);
      // Anima deflexão do flipper
      this.flipperDeflection = 0.35 * Math.min(speedFactor * 1.5, 1);
    } else {
      // Amortecimento do flipper
      this.flipperDeflection *= 0.85;
    }
  }

  getCurrentWinner() {
    if (this.slices.length === 0) return null;

    let angleOnWheel = (this.pointerAngle - (this.rotation % (Math.PI * 2))) % (Math.PI * 2);
    if (angleOnWheel < 0) angleOnWheel += Math.PI * 2;

    for (const slice of this.slices) {
      if (angleOnWheel >= slice.startAngle && angleOnWheel < slice.endAngle) {
        return slice;
      }
    }
    return this.slices[0];
  }

  /**
   * Renderização de alta precisão
   */
  render() {
    const ctx = this.ctx;
    const size = this.size;
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.radius;

    ctx.clearRect(0, 0, size, size);

    if (this.slices.length === 0) {
      this.renderEmptyState();
      return;
    }

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Aro externo com brilho e lâmpadas de cassino estilizadas
    this.renderOuterRim(r);

    // 2. Fatias rotacionadas
    ctx.save();
    ctx.rotate(this.rotation);

    for (let i = 0; i < this.slices.length; i++) {
      this.renderSlice(this.slices[i], r, i);
    }
    ctx.restore();

    // 3. Hub central com botão / logo
    this.renderCenterHub(r * 0.24);

    // 4. Ponteiro / Flipper no topo
    this.renderPointer(r);

    ctx.restore();
  }

  renderEmptyState() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Nenhuma tarefa ativa', 0, -10);

    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Adicione ou ative tarefas na lista lateral', 0, 16);

    ctx.restore();
  }

  renderOuterRim(r) {
    const ctx = this.ctx;

    // Sombra suave externa
    ctx.beginPath();
    ctx.arc(0, 0, r + 9, 0, Math.PI * 2);
    ctx.fillStyle = '#090d16';
    ctx.fill();

    // Aro metálico / neon
    const rimGrad = ctx.createLinearGradient(-r, -r, r, r);
    rimGrad.addColorStop(0, '#38bdf8');
    rimGrad.addColorStop(0.5, '#6366f1');
    rimGrad.addColorStop(1, '#ec4899');

    ctx.beginPath();
    ctx.arc(0, 0, r + 7, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = rimGrad;
    ctx.stroke();

    // Borda escura interna
    ctx.beginPath();
    ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Pequenos rebites luminosos no aro
    const rivetCount = 24;
    for (let i = 0; i < rivetCount; i++) {
      const angle = (i * Math.PI * 2) / rivetCount;
      const rx = Math.cos(angle) * (r + 4.5);
      const ry = Math.sin(angle) * (r + 4.5);

      ctx.beginPath();
      ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#38bdf8';
      ctx.fill();
    }
  }

  renderSlice(slice, r, index) {
    const ctx = this.ctx;
    const { startAngle, endAngle, color, task, percent } = slice;
    const arc = endAngle - startAngle;

    ctx.save();

    // Fatia geométrica
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, startAngle, endAngle);
    ctx.closePath();

    // Gradiente sutil para profundidade visual
    const midAngle = startAngle + arc / 2;
    const grad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
    grad.addColorStop(0, this.lightenColor(color, 25));
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, this.darkenColor(color, 20));

    ctx.fillStyle = grad;
    ctx.fill();

    // Divisórias das fatias
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Texto e ícones da fatia
    ctx.save();
    ctx.rotate(midAngle);

    // Ajusta o tamanho da fonte baseado na largura angular da fatia
    const isNarrow = arc < 0.28;
    const isVeryNarrow = arc < 0.16;

    if (!isVeryNarrow) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';

      // Sombra do texto para legibilidade impecável
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const fontSize = isNarrow ? 11 : Math.min(14, Math.max(11, 10 + arc * 6));
      ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;

      // Trunca o texto se for longo demais para caber no raio
      const maxTextLength = isNarrow ? 18 : 28;
      let text = task.title;
      if (text.length > maxTextLength) {
        text = text.substring(0, maxTextLength - 2) + '…';
      }

      const textDistance = r - 22;
      ctx.fillText(text, textDistance, 0);

      // Se houver espaço suficiente, exibe porcentagem calculada
      if (arc > 0.35) {
        ctx.font = `600 ${Math.max(9, fontSize - 3)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(`(${percent.toFixed(1)}%)`, textDistance - ctx.measureText(text).width - 8, 0);
      }
    }

    ctx.restore();
    ctx.restore();
  }

  renderCenterHub(hubRadius) {
    const ctx = this.ctx;

    // Sombra do miolo
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();

    // Anel externo do miolo
    const hubGrad = ctx.createLinearGradient(-hubRadius, -hubRadius, hubRadius, hubRadius);
    hubGrad.addColorStop(0, '#334155');
    hubGrad.addColorStop(0.5, '#1e293b');
    hubGrad.addColorStop(1, '#0f172a');

    ctx.beginPath();
    ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Centro com ícone ou texto
    ctx.beginPath();
    ctx.arc(0, 0, hubRadius * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Marcador central geométrico (retículo / alvo)
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  renderPointer(r) {
    const ctx = this.ctx;
    const topY = -r - 2;

    ctx.save();
    // Posiciona no topo
    ctx.translate(0, topY);
    // Aplica a deflexão causada pelo atrito com a divisória
    ctx.rotate(this.flipperDeflection);

    // Sombra do ponteiro
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Triângulo indicador apontando diretamente para baixo na fatia
    ctx.beginPath();
    ctx.moveTo(0, 24);         // Ponta penetrando a roleta
    ctx.lineTo(-14, -10);      // Asa esquerda
    ctx.lineTo(-6, -14);       // Ombro esquerdo
    ctx.lineTo(6, -14);        // Ombro direito
    ctx.lineTo(14, -10);       // Asa direita
    ctx.closePath();

    const pointerGrad = ctx.createLinearGradient(0, -14, 0, 24);
    pointerGrad.addColorStop(0, '#f43f5e');
    pointerGrad.addColorStop(0.6, '#ef4444');
    pointerGrad.addColorStop(1, '#dc2626');

    ctx.fillStyle = pointerGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Pino pivô do ponteiro
    ctx.beginPath();
    ctx.arc(0, -8, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  }

  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
  }
}
