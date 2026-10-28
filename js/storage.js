/**
 * storage.js - Gerenciamento de tarefas e preferências no LocalStorage
 */

const STORAGE_KEYS = {
  TASKS: 'wheel_procrastination_tasks',
  SETTINGS: 'wheel_procrastination_settings'
};

export const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Pagar contas pendentes no app do banco',
    description: 'Acessar o aplicativo bancário e liquidar boletos que vencem nesta semana.',
    priority: 5,   // 1 a 5 (5 = Crítica / Urgente)
    difficulty: 1, // 1 a 5 (1 = Muito Fácil)
    color: '#10b981', // Verde esmeralda vibrante
    enabled: true,
    category: 'Finanças'
  },
  {
    id: 'task-2',
    title: 'Organizar a mesa de trabalho e lixeira',
    description: 'Descartar papéis inúteis, recolher copos e alinhar os materiais de trabalho.',
    priority: 3,
    difficulty: 1,
    color: '#06b6d4', // Ciano
    enabled: true,
    category: 'Ambiente'
  },
  {
    id: 'task-3',
    title: 'Responder e-mails acumulados há dias',
    description: 'Zerar as mensagens prioritárias da caixa de entrada e arquivar o restante.',
    priority: 4,
    difficulty: 2,
    color: '#f59e0b', // Âmbar
    enabled: true,
    category: 'Comunicação'
  },
  {
    id: 'task-4',
    title: 'Iniciar o relatório pendente do projeto',
    description: 'Escrever ao menos a introdução e o resumo dos dados alcançados no mês.',
    priority: 5,
    difficulty: 4,
    color: '#ef4444', // Vermelho Coral
    enabled: true,
    category: 'Trabalho'
  },
  {
    id: 'task-5',
    title: 'Fazer 20 minutos de caminhada / alongamento',
    description: 'Levantar da cadeira, beber água e dar uma volta rápida ao ar livre.',
    priority: 4,
    difficulty: 2,
    color: '#ec4899', // Rosa vibrante
    enabled: true,
    category: 'Saúde'
  },
  {
    id: 'task-6',
    title: 'Estudar 1 módulo do curso / tutorial',
    description: 'Assistir a uma aula curta e fazer anotações práticas sobre o assunto.',
    priority: 4,
    difficulty: 3,
    color: '#8b5cf6', // Roxo Violeta
    enabled: true,
    category: 'Desenvolvimento'
  },
  {
    id: 'task-7',
    title: 'Ligar para marcar consulta médica',
    description: 'Entrar em contato com o consultório para agendar exames de rotina.',
    priority: 4,
    difficulty: 1,
    color: '#3b82f6', // Azul Real
    enabled: true,
    category: 'Saúde'
  },
  {
    id: 'task-8',
    title: 'Fazer backup dos arquivos importantes',
    description: 'Sincronizar a pasta de documentos essenciais com a nuvem ou drive externo.',
    priority: 3,
    difficulty: 2,
    color: '#14b8a6', // Teal
    enabled: true,
    category: 'Tecnologia'
  }
];

export const Storage = {
  getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        this.saveTasks(DEFAULT_TASKS);
        return [...DEFAULT_TASKS];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_TASKS];
    } catch (e) {
      console.warn('Erro ao carregar tarefas do LocalStorage, usando padrão:', e);
      return [...DEFAULT_TASKS];
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Erro ao salvar tarefas:', e);
    }
  },

  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : { soundEnabled: true, hideWelcomeModal: false, theme: 'dark', lang: 'pt' };
    } catch (e) {
      return { soundEnabled: true, hideWelcomeModal: false, theme: 'dark', lang: 'pt' };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  },

  resetToDefault(tasks = DEFAULT_TASKS) {
    this.saveTasks(tasks);
    return [...tasks];
  }
};
