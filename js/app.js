/**
 * app.js - Controlador Principal da Aplicação Wheel of Procrastination
 */

import { Storage, DEFAULT_TASKS } from './storage.js';
import { Sound } from './sound.js';
import { FX } from './fx.js';
import { WheelOfProcrastination } from './wheel.js';

class ProcrastinationApp {
  constructor() {
    this.tasks = [];
    this.settings = { soundEnabled: true, hideWelcomeModal: false };
    this.currentWinner = null;
    this.pomodoroInterval = null;
    this.pomodoroSecondsLeft = 25 * 60;
    this.isPomodoroRunning = false;

    this.dom = {
      wheelCanvas: document.getElementById('wheelCanvas'),
      wheelArena: document.getElementById('wheelArena'),
      fxCanvas: document.getElementById('fxCanvas'),
      spinBtn: document.getElementById('spinBtn'),
      taskList: document.getElementById('taskList'),
      taskCountBadge: document.getElementById('taskCountBadge'),
      addTaskForm: document.getElementById('addTaskForm'),
      toggleAddTaskBtn: document.getElementById('toggleAddTaskBtn'),
      taskTitleInput: document.getElementById('taskTitleInput'),
      taskDescInput: document.getElementById('taskDescInput'),
      taskPrioritySelect: document.getElementById('taskPrioritySelect'),
      taskDifficultySelect: document.getElementById('taskDifficultySelect'),
      taskColorInput: document.getElementById('taskColorInput'),
      colorPresets: document.getElementById('colorPresets'),
      weightPreview: document.getElementById('weightPreview'),
      soundToggleBtn: document.getElementById('soundToggleBtn'),
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      articleModalBtn: document.getElementById('articleModalBtn'),
      sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
      sidebarCloseBtn: document.getElementById('sidebarCloseBtn'),
      sidebar: document.getElementById('sidebar'),
      sidebarBackdrop: document.getElementById('sidebarBackdrop'),
      resetTasksBtn: document.getElementById('resetTasksBtn'),

      // Modais
      articleModal: document.getElementById('articleModal'),
      closeArticleModalBtn: document.getElementById('closeArticleModalBtn'),
      startAppFromArticleBtn: document.getElementById('startAppFromArticleBtn'),
      dontShowArticleCheckbox: document.getElementById('dontShowArticleCheckbox'),

      winnerModal: document.getElementById('winnerModal'),
      closeWinnerModalBtn: document.getElementById('closeWinnerModalBtn'),
      winnerTitle: document.getElementById('winnerTitle'),
      winnerDescription: document.getElementById('winnerDescription'),
      winnerPriorityBadge: document.getElementById('winnerPriorityBadge'),
      winnerDifficultyBadge: document.getElementById('winnerDifficultyBadge'),
      winnerOddsBadge: document.getElementById('winnerOddsBadge'),
      winnerStrategyTip: document.getElementById('winnerStrategyTip'),
      spinAgainBtn: document.getElementById('spinAgainBtn'),
      completeTaskBtn: document.getElementById('completeTaskBtn'),

      // Modal de Edição
      editTaskModal: document.getElementById('editTaskModal'),
      closeEditModalBtn: document.getElementById('closeEditModalBtn'),
      cancelEditBtn: document.getElementById('cancelEditBtn'),
      editTaskForm: document.getElementById('editTaskForm'),
      editTaskId: document.getElementById('editTaskId'),
      editTaskTitle: document.getElementById('editTaskTitle'),
      editTaskDesc: document.getElementById('editTaskDesc'),
      editTaskPriority: document.getElementById('editTaskPriority'),
      editTaskDifficulty: document.getElementById('editTaskDifficulty'),
      editTaskColor: document.getElementById('editTaskColor'),

      // Pomodoro no modal
      pomodoroTimerDisplay: document.getElementById('pomodoroTimerDisplay'),
      pomodoroToggleBtn: document.getElementById('pomodoroToggleBtn')
    };
  }

  init() {
    this.tasks = Storage.getTasks();
    this.settings = Storage.getSettings();

    // Configura tema claro/escuro
    this.applyTheme(this.settings.theme || 'dark');

    // Configura áudio
    Sound.enabled = this.settings.soundEnabled;
    this.updateSoundButtonUI();

    // Inicia FX
    FX.init(this.dom.fxCanvas);

    // Inicia Roleta
    this.wheel = new WheelOfProcrastination(this.dom.wheelCanvas, this.dom.wheelArena, {
      onSpinStart: () => this.handleSpinStart(),
      onSpinEnd: (winner) => this.handleSpinEnd(winner)
    });

    this.wheel.setTasks(this.tasks);

    // Renderiza lista
    this.renderTaskList();
    this.updateFormPreview();

    // Eventos
    this.bindEvents();

    // Exibe o artigo modal inicial caso não tenha sido suprimido
    if (!this.settings.hideWelcomeModal) {
      this.openModal(this.dom.articleModal);
    }
  }

  bindEvents() {
    // Giro da roleta
    this.dom.spinBtn.addEventListener('click', () => this.spin());

    // Tecla espaço para girar
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isAnyModalOpen() && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        this.spin();
      } else if (e.code === 'Escape') {
        this.closeAllModals();
        this.closeSidebarOnMobile();
      }
    });

    // Alternador de tema claro/escuro
    if (this.dom.themeToggleBtn) {
      this.dom.themeToggleBtn.addEventListener('click', () => {
        const newTheme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.settings.theme = newTheme;
        Storage.saveSettings(this.settings);
        this.applyTheme(newTheme);
      });
    }

    // Toggle de som
    this.dom.soundToggleBtn.addEventListener('click', () => {
      this.settings.soundEnabled = !this.settings.soundEnabled;
      Sound.enabled = this.settings.soundEnabled;
      Storage.saveSettings(this.settings);
      this.updateSoundButtonUI();
    });

    // Artigo Modal
    this.dom.articleModalBtn.addEventListener('click', () => {
      this.openModal(this.dom.articleModal);
    });

    this.dom.closeArticleModalBtn.addEventListener('click', () => {
      this.closeModal(this.dom.articleModal);
    });

    this.dom.startAppFromArticleBtn.addEventListener('click', () => {
      if (this.dom.dontShowArticleCheckbox.checked) {
        this.settings.hideWelcomeModal = true;
        Storage.saveSettings(this.settings);
      }
      this.closeModal(this.dom.articleModal);
    });

    // Modal Vencedor
    this.dom.closeWinnerModalBtn.addEventListener('click', () => {
      this.closeWinnerModal();
    });

    this.dom.spinAgainBtn.addEventListener('click', () => {
      this.closeWinnerModal();
      setTimeout(() => this.spin(), 300);
    });

    this.dom.completeTaskBtn.addEventListener('click', () => {
      if (this.currentWinner) {
        this.removeTask(this.currentWinner.task.id);
      }
      this.closeWinnerModal();
    });

    // Pomodoro
    this.dom.pomodoroToggleBtn.addEventListener('click', () => {
      this.togglePomodoro();
    });

    // Alternar visibilidade do formulário de nova atividade
    if (this.dom.toggleAddTaskBtn) {
      this.dom.toggleAddTaskBtn.addEventListener('click', () => {
        const isExpanded = this.dom.addTaskForm.classList.toggle('is-open');
        this.dom.addTaskForm.classList.toggle('is-collapsed', !isExpanded);
        this.dom.toggleAddTaskBtn.classList.toggle('active', isExpanded);
        this.dom.toggleAddTaskBtn.setAttribute('aria-expanded', String(isExpanded));
        if (isExpanded) {
          this.dom.taskTitleInput.focus();
        }
      });
    }

    // Submissão de nova tarefa
    this.dom.addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddTask();
    });

    // Atualização do cálculo no formulário de adição
    this.dom.taskPrioritySelect.addEventListener('change', () => this.updateFormPreview());
    this.dom.taskDifficultySelect.addEventListener('change', () => this.updateFormPreview());

    // Paleta rápida de cores
    if (this.dom.colorPresets) {
      this.dom.colorPresets.addEventListener('click', (e) => {
        const chip = e.target.closest('.color-chip');
        if (chip) {
          const color = chip.dataset.color;
          this.dom.taskColorInput.value = color;
          this.dom.colorPresets.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        }
      });
    }

    // Resetar para tarefas padrão
    if (this.dom.resetTasksBtn) {
      this.dom.resetTasksBtn.addEventListener('click', () => {
        if (confirm('Deseja restaurar as tarefas padrão sugeridas? Suas tarefas personalizadas serão redefinidas.')) {
          this.tasks = Storage.resetToDefault();
          this.wheel.setTasks(this.tasks);
          this.renderTaskList();
        }
      });
    }

    // Controle lateral no mobile
    if (this.dom.sidebarToggleBtn) {
      this.dom.sidebarToggleBtn.addEventListener('click', () => {
        this.openSidebarOnMobile();
      });
    }
    if (this.dom.sidebarCloseBtn) {
      this.dom.sidebarCloseBtn.addEventListener('click', () => {
        this.closeSidebarOnMobile();
      });
    }
    if (this.dom.sidebarBackdrop) {
      this.dom.sidebarBackdrop.addEventListener('click', () => {
        this.closeSidebarOnMobile();
      });
    }

    // Modal de Edição de Tarefas
    if (this.dom.closeEditModalBtn) {
      this.dom.closeEditModalBtn.addEventListener('click', () => this.closeEditModal());
    }
    if (this.dom.cancelEditBtn) {
      this.dom.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
    }
    if (this.dom.editTaskForm) {
      this.dom.editTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveTaskEdit();
      });
    }

    // Fechar modais ao clicar no backdrop escuro
    [this.dom.articleModal, this.dom.winnerModal, this.dom.editTaskModal].forEach(modal => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          if (modal === this.dom.winnerModal) {
            this.closeWinnerModal();
          } else if (modal === this.dom.editTaskModal) {
            this.closeEditModal();
          } else {
            this.closeModal(modal);
          }
        }
      });
    });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (this.wheel) {
      this.wheel.render();
    }
  }

  updateSoundButtonUI() {
    if (this.settings.soundEnabled) {
      this.dom.soundToggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <span class="btn-text">Som Ativo</span>
      `;
      this.dom.soundToggleBtn.classList.remove('muted');
    } else {
      this.dom.soundToggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
        <span class="btn-text">Mudo</span>
      `;
      this.dom.soundToggleBtn.classList.add('muted');
    }
  }

  updateFormPreview() {
    const p = Number(this.dom.taskPrioritySelect.value) || 3;
    const d = Number(this.dom.taskDifficultySelect.value) || 3;
    const weight = (p / d).toFixed(2);

    let explanation = '';
    if (p >= 4 && d <= 2) {
      explanation = 'Alta Prioridade + Baixa Dificuldade = Fatia muito ampla. Excelente para começar rápido.';
    } else if (p <= 2 && d >= 4) {
      explanation = 'Baixa Prioridade + Alta Dificuldade = Fatia reduzida. O cérebro tende a postergar tarefas pesadas.';
    } else {
      explanation = `Razão P/D: ${weight}. Fatias se ajustam proporcionalmente ao restante das atividades.`;
    }

    this.dom.weightPreview.textContent = explanation;
  }

  handleAddTask() {
    const title = this.dom.taskTitleInput.value.trim();
    if (!title) return;

    const description = this.dom.taskDescInput ? this.dom.taskDescInput.value.trim() : '';
    const priority = Number(this.dom.taskPrioritySelect.value) || 3;
    const difficulty = Number(this.dom.taskDifficultySelect.value) || 3;
    const color = this.dom.taskColorInput.value || '#3b82f6';

    const newTask = {
      id: 'task-' + Date.now(),
      title,
      description,
      priority,
      difficulty,
      color,
      enabled: true
    };

    this.tasks.push(newTask);
    Storage.saveTasks(this.tasks);

    this.wheel.setTasks(this.tasks);
    this.renderTaskList();

    // Limpa formulário
    this.dom.taskTitleInput.value = '';
    if (this.dom.taskDescInput) this.dom.taskDescInput.value = '';
    Sound.playPop();

    // Fecha o formulário para economizar espaço e focar na lista
    this.dom.addTaskForm.classList.remove('is-open');
    this.dom.addTaskForm.classList.add('is-collapsed');
    if (this.dom.toggleAddTaskBtn) {
      this.dom.toggleAddTaskBtn.classList.remove('active');
      this.dom.toggleAddTaskBtn.setAttribute('aria-expanded', 'false');
    }
  }

  openEditModal(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    this.dom.editTaskId.value = task.id;
    this.dom.editTaskTitle.value = task.title;
    this.dom.editTaskDesc.value = task.description || '';
    this.dom.editTaskPriority.value = String(task.priority || 3);
    this.dom.editTaskDifficulty.value = String(task.difficulty || 3);
    this.dom.editTaskColor.value = task.color || '#3b82f6';

    this.openModal(this.dom.editTaskModal);
    this.dom.editTaskTitle.focus();
  }

  closeEditModal() {
    this.closeModal(this.dom.editTaskModal);
  }

  handleSaveTaskEdit() {
    const id = this.dom.editTaskId.value;
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    const title = this.dom.editTaskTitle.value.trim();
    if (!title) return;

    task.title = title;
    task.description = this.dom.editTaskDesc.value.trim();
    task.priority = Number(this.dom.editTaskPriority.value) || 3;
    task.difficulty = Number(this.dom.editTaskDifficulty.value) || 3;
    task.color = this.dom.editTaskColor.value || '#3b82f6';

    Storage.saveTasks(this.tasks);
    this.wheel.setTasks(this.tasks);
    this.renderTaskList();
    this.closeEditModal();
    Sound.playTick(1.2);
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.enabled = !task.enabled;
      Storage.saveTasks(this.tasks);
      this.wheel.setTasks(this.tasks);
      this.renderTaskList();
      Sound.playTick(1.2);
    }
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    Storage.saveTasks(this.tasks);
    this.wheel.setTasks(this.tasks);
    this.renderTaskList();
    Sound.playPop();
  }

  changeTaskColor(id, newColor) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.color = newColor;
      Storage.saveTasks(this.tasks);
      this.wheel.setTasks(this.tasks);
      this.renderTaskList();
    }
  }

  renderTaskList() {
    const activeTasks = this.tasks.filter(t => t.enabled !== false);
    this.dom.taskCountBadge.textContent = `${activeTasks.length}/${this.tasks.length} ativas`;

    if (this.tasks.length === 0) {
      this.dom.taskList.innerHTML = `
        <div class="empty-list-placeholder">
          <p>Nenhuma tarefa cadastrada.</p>
          <small>Adicione tarefas acima para vê-las na roleta!</small>
        </div>
      `;
      return;
    }

    const weights = this.wheel.getSliceWeights();
    const weightMap = new Map();
    weights.forEach(w => weightMap.set(w.id, w.percent));

    this.dom.taskList.innerHTML = this.tasks.map(task => {
      const p = Number(task.priority);
      const d = Number(task.difficulty);
      const percent = weightMap.get(task.id) || 0;
      const isEnabled = task.enabled !== false;

      return `
        <div class="task-card ${isEnabled ? '' : 'task-disabled'}" data-id="${task.id}">
          <div class="task-card-header">
            <label class="task-checkbox-wrap" title="${isEnabled ? 'Desativar da roleta' : 'Ativar na roleta'}">
              <input type="checkbox" class="task-toggle-checkbox" ${isEnabled ? 'checked' : ''} data-id="${task.id}">
              <span class="custom-checkbox"></span>
            </label>

            <span class="task-title" title="${this.escapeHtml(task.title)}">${this.escapeHtml(task.title)}</span>

            <div class="task-color-wrap" title="Alterar cor da fatia">
              <input type="color" class="task-color-picker" value="${task.color}" data-id="${task.id}">
              <span class="task-color-preview" style="background-color: ${task.color}"></span>
            </div>

            <div class="task-item-actions">
              <button type="button" class="task-edit-btn" title="Editar atividade" data-id="${task.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <button type="button" class="task-delete-btn" title="Remover tarefa" data-id="${task.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          ${task.description ? `<p class="task-desc" title="${this.escapeHtml(task.description)}">${this.escapeHtml(task.description)}</p>` : ''}

          <div class="task-card-meta">
            <span class="badge priority-badge" title="Prioridade: quanto maior, maior a fatia">
              P: ${p}/5
            </span>
            <span class="badge difficulty-badge" title="Dificuldade: quanto maior, menor a fatia">
              D: ${d}/5
            </span>
            <span class="badge odds-badge" title="Probabilidade matemática de sorteio">
              ${isEnabled ? percent.toFixed(1) + '%' : '0%'}
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Eventos nos itens da lista
    this.dom.taskList.querySelectorAll('.task-toggle-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        this.toggleTask(e.target.dataset.id);
      });
    });

    this.dom.taskList.querySelectorAll('.task-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openEditModal(btn.dataset.id);
      });
    });

    this.dom.taskList.querySelectorAll('.task-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        this.removeTask(id);
      });
    });

    this.dom.taskList.querySelectorAll('.task-color-picker').forEach(input => {
      input.addEventListener('change', (e) => {
        this.changeTaskColor(e.target.dataset.id, e.target.value);
      });
    });
  }

  spin() {
    if (this.wheel.isSpinning) return;
    const activeTasks = this.tasks.filter(t => t.enabled !== false);
    if (activeTasks.length === 0) {
      alert('Ative pelo menos uma tarefa na lista para poder girar a roleta!');
      return;
    }

    this.wheel.spin();
  }

  handleSpinStart() {
    this.dom.spinBtn.disabled = true;
    this.dom.spinBtn.classList.add('spinning');
    this.dom.spinBtn.innerHTML = `
      <svg class="spin-icon rotating" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
      <span>GIRANDO...</span>
    `;
    this.closeSidebarOnMobile();
  }

  handleSpinEnd(winner) {
    this.dom.spinBtn.disabled = false;
    this.dom.spinBtn.classList.remove('spinning');
    this.dom.spinBtn.innerHTML = `
      <svg class="spin-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
      <span>GIRAR ROLETA</span>
    `;

    if (!winner) return;
    this.currentWinner = winner;

    // Celebração: Áudio Fanfarra + Confetes + Fogos de Artifício!
    Sound.playFanfare();
    FX.celebrate();

    // Preenche e abre o modal de resultado
    this.showWinnerModal(winner);
  }

  showWinnerModal(winner) {
    const { task, percent } = winner;
    const p = Number(task.priority);
    const d = Number(task.difficulty);

    this.dom.winnerTitle.textContent = task.title;

    if (task.description && task.description.trim()) {
      this.dom.winnerDescription.textContent = task.description;
      this.dom.winnerDescription.style.display = 'block';
    } else {
      this.dom.winnerDescription.textContent = '';
      this.dom.winnerDescription.style.display = 'none';
    }

    this.dom.winnerPriorityBadge.textContent = `Prioridade: ${p}/5 (${this.getPriorityLabel(p)})`;
    this.dom.winnerDifficultyBadge.textContent = `Dificuldade: ${d}/5 (${this.getDifficultyLabel(d)})`;
    this.dom.winnerOddsBadge.textContent = `Probabilidade: ${percent.toFixed(1)}%`;

    // Dica psicológica personalizada contra procrastinação
    this.dom.winnerStrategyTip.innerHTML = this.getAntiProcrastinationTip(p, d);

    // Reseta Pomodoro
    this.resetPomodoro();

    this.openModal(this.dom.winnerModal);
  }

  closeWinnerModal() {
    this.closeModal(this.dom.winnerModal);
    this.wheel.resetZoom();
    FX.stop();
    this.stopPomodoro();
  }

  getPriorityLabel(p) {
    const labels = {
      1: 'Baixa',
      2: 'Moderada',
      3: 'Importante',
      4: 'Muito Alta',
      5: 'Urgente / Crítica'
    };
    return labels[p] || 'Importante';
  }

  getDifficultyLabel(d) {
    const labels = {
      1: 'Muito Fácil (2 min)',
      2: 'Fácil',
      3: 'Média',
      4: 'Exigente / Complexa',
      5: 'Extrema'
    };
    return labels[d] || 'Média';
  }

  getAntiProcrastinationTip(priority, difficulty) {
    if (difficulty === 1) {
      return `
        <strong>Regra dos 2 Minutos:</strong> Como essa tarefa tem dificuldade muito baixa, não pense nem anote.
        Levante-se e termine-a agora mesmo antes de fazer qualquer outra coisa!
      `;
    } else if (difficulty >= 4) {
      return `
        <strong>Técnica do Queijo Suíço (Micro-Passo):</strong> Essa tarefa é pesada e gera resistência inicial.
        Não tente resolver tudo de uma vez. Faça apenas o <em>primeiro parágrafo</em> ou os <em>primeiros 5 minutos</em>. Entrar em ação dissolve a ansiedade.
      `;
    } else if (priority === 5) {
      return `
        <strong>Contagem Regressiva 5-4-3-2-1:</strong> Prioridade máxima! Não espere estar com vontade. A motivação surge após a ação. Respire fundo, conte regressivamente e comece agora.
      `;
    } else {
      return `
        <strong>Bloco de Foco por 25 Minutos:</strong> Coloque o celular no modo não perturbe. O sorteio já eliminou a fadiga de escolha. Aproveite o momento para avançar.
      `;
    }
  }

  // Lógica do Pomodoro dentro do modal
  togglePomodoro() {
    if (this.isPomodoroRunning) {
      this.stopPomodoro();
      this.dom.pomodoroToggleBtn.textContent = 'Continuar Pomodoro';
      this.dom.pomodoroToggleBtn.classList.remove('running');
    } else {
      this.isPomodoroRunning = true;
      this.dom.pomodoroToggleBtn.textContent = 'Pausar Foco';
      this.dom.pomodoroToggleBtn.classList.add('running');

      this.pomodoroInterval = setInterval(() => {
        this.pomodoroSecondsLeft--;
        this.updatePomodoroDisplay();

        if (this.pomodoroSecondsLeft <= 0) {
          this.stopPomodoro();
          Sound.playFanfare();
          alert('Parabéns! Seus 25 minutos de foco terminaram. Faça uma pausa de 5 minutos!');
        }
      }, 1000);
    }
  }

  stopPomodoro() {
    this.isPomodoroRunning = false;
    if (this.pomodoroInterval) {
      clearInterval(this.pomodoroInterval);
      this.pomodoroInterval = null;
    }
  }

  resetPomodoro() {
    this.stopPomodoro();
    this.pomodoroSecondsLeft = 25 * 60;
    this.updatePomodoroDisplay();
    this.dom.pomodoroToggleBtn.textContent = 'Iniciar Foco (25 min)';
    this.dom.pomodoroToggleBtn.classList.remove('running');
  }

  updatePomodoroDisplay() {
    const mins = Math.floor(this.pomodoroSecondsLeft / 60);
    const secs = this.pomodoroSecondsLeft % 60;
    this.dom.pomodoroTimerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  openSidebarOnMobile() {
    if (this.dom.sidebar) this.dom.sidebar.classList.add('open');
    if (this.dom.sidebarBackdrop) this.dom.sidebarBackdrop.classList.add('visible');
  }

  closeSidebarOnMobile() {
    if (this.dom.sidebar) this.dom.sidebar.classList.remove('open');
    if (this.dom.sidebarBackdrop) this.dom.sidebarBackdrop.classList.remove('visible');
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    if (!this.isAnyModalOpen()) {
      document.body.classList.remove('modal-open');
    }
  }

  closeAllModals() {
    this.closeModal(this.dom.articleModal);
    this.closeEditModal();
    this.closeWinnerModal();
  }

  isAnyModalOpen() {
    return document.querySelectorAll('.modal-overlay.active').length > 0;
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Inicia aplicação assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const app = new ProcrastinationApp();
  app.init();
});
