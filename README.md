# Roleta Anti-Procrastinação

Aplicação web interativa criada para eliminar a paralisia de escolha e vencer a procrastinação. O aplicativo sorteia sua próxima tarefa através de uma roleta inteligente, na qual o tamanho de cada fatia é matematicamente proporcional à **prioridade** e inversamente proporcional à **dificuldade** da atividade.

---

## Como Funciona a Matemática da Roleta

Cada tarefa possui dois parâmetros de 1 a 5:
- **Prioridade ($P \in [1, 5]$)**: Quanto maior a urgência ou importância, **maior a fatia** na roleta.
- **Dificuldade ($D \in [1, 5]$)**: Quanto mais pesada a tarefa, **menor a fatia** (respeitando a tendência biológica do cérebro de postergar o que gera atrito e favorecendo começar pelo que é rápido).

$$\text{Peso} = \frac{\text{Prioridade}}{\text{Dificuldade}}$$

$$\text{Probabilidade (\%)} = \left(\frac{\text{Peso}_i}{\sum \text{Pesos}}\right) \times 100\%$$

*Exemplo*: Uma tarefa de Prioridade 5 e Dificuldade 1 tem peso $5.0$, enquanto uma tarefa de Prioridade 1 e Dificuldade 5 tem peso $0.2$ (uma diferença de até 25x nas chances de sorteio).

---

## Recursos

- **Modo Claro e Modo Escuro**: Alternância de tema com persistência em `localStorage`.
- **Interface Limpa com Ícones Vetoriais SVG**: Tipografia nítida e ausência de emojis genéricos.
- **Roleta em Canvas 2D**: Renderização nítida em alta densidade de pixels, ponteiro com física de impacto e clique mecânico de catraca.
- **Efeito de Zoom Cinemático**: A roleta inicia em tamanho padrão e, ao desacelerar, dá um zoom suave focando na fatia e no ponteiro vencedor (otimizado especialmente para telas de celulares).
- **Listagem Lateral e Edição Completa**:
  - Inclusão e **edição completa de atividades** (título, descrição detalhada, prioridade, dificuldade e cor).
  - Campo de **descrição da atividade** visível nos cartões e no modal de resultado.
  - Seleção de cor customizada ou paleta rápida.
  - Ativar/desativar tarefas sem excluí-las.
  - Exibição da probabilidade percentual calculada ao vivo.
- **Celebração e Ação Pós-Sorteio**:
  - Efeito visual de confetes 3D e fogos de artifício em Canvas.
  - Efeitos sonoros via Web Audio API (sem dependências externas).
  - Dica psicológica contextual contra procrastinação (Regra dos 2 Minutos, Micro-Passos, etc.).
  - **Temporizador Pomodoro integrado (25 minutos)** para iniciar o foco sem distrações.
- **Artigo Inicial Educativo**:
  - Modal automático com explicação neurocientífica sobre o ciclo da procrastinação e estratégias práticas para superá-la.
  - Opção de suprimir a exibição automática ou reabrir a qualquer momento pelo cabeçalho.
- **Persistência Local**: Tarefas e preferências salvas automaticamente no `localStorage`.
- **100% Responsivo**: Layout adaptável para desktop e celulares (com gaveta deslizante para a lista de tarefas).

---

## Como Rodar o Projeto

O projeto foi construído com tecnologias web padrão (HTML5, Vanilla CSS e ES Modules), funcionando com qualquer servidor estático local.

### Opção 1: Usando Node.js / npm (Recomendado)

```bash
# Iniciar o servidor local na porta 3000
npm run dev
# ou
npx serve . -p 3000
```

### Opção 2: Usando Python

```bash
# Python 3
python3 -m http.server 3000
```

### Opção 3: Extensões de IDE (Live Server)
Abra a pasta no VS Code / Antigravity e clique em **Go Live** com a extensão Live Server no arquivo `index.html`.

Acesse no navegador:
[http://localhost:3000](http://localhost:3000)

---

## Estrutura de Arquivos

```text
wheel-of-procrastination/
├── index.html         # Marcação semântica e modais
├── css/
│   └── style.css      # Sistema de design, dark theme e responsividade
├── js/
│   ├── app.js         # Controlador principal e eventos da interface
│   ├── wheel.js       # Motor da roleta, física e animação de zoom
│   ├── fx.js          # Simulador de partículas de confetes e fogos
│   ├── sound.js       # Síntese sonora procedural via Web Audio API
│   └── storage.js     # Gerenciamento de tarefas e LocalStorage
├── package.json       # Configuração e scripts de execução
└── README.md          # Documentação do projeto
```
