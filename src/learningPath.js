import { formulaReference } from './data/formulas.js';
import { glossaryCategories, glossaryTerms } from './data/glossary.js';
import { learningModules } from './data/learningModules.js';
import {
  completionPercent,
  loadLearningProgress,
  resetLearningProgress,
  saveLearningProgress
} from './learningProgress.js';
import { braggThetaDeg, electronWavelengthPm } from './state.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function listItems(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function diagramForModule(index) {
  const colors = ['#62d7f0', '#92d46f', '#e6b55a', '#ae98e8'];
  const accent = colors[index % colors.length];
  return `
    <svg viewBox="0 0 760 260" role="img" aria-label="Schematic lesson diagram">
      <rect x="18" y="18" width="724" height="224" rx="16" fill="#0b1013" stroke="rgba(220,235,228,0.18)" />
      <g transform="translate(${40 + index * 4}, 0)">
        <rect x="76" y="28" width="64" height="58" rx="8" fill="#29343a" stroke="#6d7d83" />
        <line x1="108" y1="86" x2="108" y2="174" stroke="#62d7f0" stroke-width="5" stroke-linecap="round" />
        <circle cx="108" cy="174" r="16" fill="#e6b55a" fill-opacity="0.72" />
        <g transform="translate(72, 176) rotate(-18)">
          <rect x="0" y="0" width="190" height="28" rx="4" fill="#58615e" stroke="#ffd991" />
          <line x1="36" y1="-10" x2="158" y2="-10" stroke="${accent}" stroke-width="3" stroke-opacity="0.75" />
          <line x1="48" y1="-22" x2="170" y2="-22" stroke="${accent}" stroke-width="3" stroke-opacity="0.45" />
        </g>
        <path d="M124 174 C210 88 300 76 396 118" fill="none" stroke="#92d46f" stroke-width="3" stroke-opacity="0.7" />
        <path d="M124 174 C230 242 318 232 412 178" fill="none" stroke="#e784ba" stroke-width="3" stroke-opacity="0.65" />
        <rect x="456" y="54" width="152" height="150" rx="10" fill="#1a2a2f" stroke="#d6f5f5" stroke-opacity="0.55" />
        <line x1="470" y1="98" x2="596" y2="158" stroke="${accent}" stroke-width="8" stroke-opacity="0.26" />
        <line x1="468" y1="112" x2="592" y2="172" stroke="#f5fbfb" stroke-width="2" stroke-opacity="0.42" />
        <line x1="488" y1="176" x2="604" y2="80" stroke="#62d7f0" stroke-width="7" stroke-opacity="0.22" />
        <line x1="486" y1="188" x2="606" y2="92" stroke="#f5fbfb" stroke-width="2" stroke-opacity="0.36" />
      </g>
    </svg>
  `;
}

export class LearningPath {
  constructor({ moduleList, lessonWorkspace, miniGlossary, formulaPanel, onExperiment = () => {} }) {
    this.moduleList = moduleList;
    this.lessonWorkspace = lessonWorkspace;
    this.miniGlossary = miniGlossary;
    this.formulaPanel = formulaPanel;
    this.onExperiment = onExperiment;
    this.progress = loadLearningProgress();
    this.selectedQuestionIndex = 0;
    this.glossaryQuery = '';
    this.glossaryCategory = 'all';
    this.render();
  }

  selectedModule() {
    return learningModules.find((module) => module.id === this.progress.selectedModuleId) ?? learningModules[0];
  }

  save(progress = this.progress) {
    this.progress = progress;
    saveLearningProgress(this.progress);
  }

  render() {
    this.renderModuleList();
    this.renderLesson();
    this.renderGlossary();
    this.renderFormula();
    this.bindTeacherToggle();
  }

  moduleStatus(module) {
    if (this.progress.completedModules.includes(module.id)) return 'complete';
    if (this.progress.inProgressModules.includes(module.id) || this.progress.quizScores[module.id]) return 'in progress';
    return 'not started';
  }

  renderModuleList() {
    const percent = completionPercent(this.progress, learningModules);
    this.moduleList.innerHTML = `
      <div class="learning-progress-card">
        <div><strong>${percent}% complete</strong><span>${this.progress.completedModules.length} of ${learningModules.length} modules</span></div>
        <div class="progress-track"><b style="width:${percent}%"></b></div>
        <div class="learning-progress-actions">
          <button type="button" data-learning-action="continue">Continue where I left off</button>
          <button type="button" data-learning-action="reset">Reset progress</button>
        </div>
      </div>
      ${learningModules.map((module, index) => {
        const status = this.moduleStatus(module);
        const selected = module.id === this.progress.selectedModuleId;
        const score = this.progress.quizScores[module.id];
        return `
          <button class="module-card ${selected ? 'active' : ''} ${status.replace(' ', '-')}" type="button" data-module="${module.id}">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <strong>${escapeHtml(module.shortTitle || module.title)}</strong>
            <small>${escapeHtml(module.estimatedTime)} - ${escapeHtml(status)}${score ? ` - quiz ${score.correct}/${score.total}` : ''}</small>
          </button>
        `;
      }).join('')}
    `;

    this.moduleList.querySelectorAll('[data-module]').forEach((button) => {
      button.addEventListener('click', () => {
        this.progress.selectedModuleId = button.dataset.module;
        if (!this.progress.inProgressModules.includes(button.dataset.module)) {
          this.progress.inProgressModules.push(button.dataset.module);
        }
        this.selectedQuestionIndex = 0;
        this.save();
        this.render();
      });
    });

    this.moduleList.querySelector('[data-learning-action="continue"]').addEventListener('click', () => this.render());
    this.moduleList.querySelector('[data-learning-action="reset"]').addEventListener('click', () => {
      this.progress = resetLearningProgress();
      this.selectedQuestionIndex = 0;
      this.render();
    });
  }

  renderLesson() {
    const module = this.selectedModule();
    const bookmarked = this.progress.bookmarks.includes(module.id);
    const note = this.progress.notes[module.id] || '';
    const quiz = this.renderQuiz(module);
    this.lessonWorkspace.innerHTML = `
      <div class="lesson-hero">
        <div>
          <span>${escapeHtml(module.category)} - ${escapeHtml(module.difficulty)}</span>
          <h2>${escapeHtml(module.title)}</h2>
          <p>${escapeHtml(module.explanation)}</p>
        </div>
        <div class="lesson-actions">
          <button id="markModuleComplete" type="button">${this.progress.completedModules.includes(module.id) ? 'Complete' : 'Mark complete'}</button>
          <button id="bookmarkModule" type="button">${bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
        </div>
      </div>
      <div class="learning-mode-selector" role="group" aria-label="Learning mode">
        ${['learn', 'practice', 'revise', 'teacher'].map((mode) => `
          <button type="button" class="${this.progress.selectedMode === mode ? 'active' : ''}" data-learning-mode="${mode}">${mode === 'teacher' ? 'Teacher Demo' : mode[0].toUpperCase() + mode.slice(1)}</button>
        `).join('')}
      </div>
      <div class="lesson-diagram">${diagramForModule(learningModules.indexOf(module))}</div>
      ${this.renderModeContent(module)}
      <div class="lesson-grid">
        <article class="lesson-card">
          <span>Learning objectives</span>
          <ul>${listItems(module.learningObjectives)}</ul>
        </article>
        <article class="lesson-card">
          <span>Key ideas</span>
          <ul>${listItems(module.keyIdeas)}</ul>
        </article>
        <article class="lesson-card">
          <span>Why this matters in real EBSD</span>
          <p>${escapeHtml(module.whyItMatters)}</p>
        </article>
        <article class="lesson-card misconception">
          <span>Common misconception</span>
          <p>${escapeHtml(module.misconception)}</p>
        </article>
        ${quiz}
        ${this.renderSpecialModuleContent(module)}
        <article class="lesson-card">
          <span>Mini-experiments</span>
          <div class="experiment-list">
            ${module.miniExperiments.map((experiment) => `
              <button type="button" data-experiment="${escapeHtml(experiment.action)}">${escapeHtml(experiment.label)}</button>
              <p>${escapeHtml(experiment.text)}</p>
            `).join('')}
          </div>
        </article>
        <article class="lesson-card">
          <span>Practice tasks</span>
          <ul>${listItems(module.practiceTasks)}</ul>
        </article>
        <article class="lesson-card">
          <span>Student notes</span>
          <textarea id="moduleNotes" rows="5" placeholder="Write local notes for this module...">${escapeHtml(note)}</textarea>
          <div class="note-actions">
            <button id="saveModuleNote" type="button">Save note</button>
            <button id="clearModuleNote" type="button">Clear note</button>
          </div>
        </article>
        <article class="lesson-card topics-card">
          <span>Glossary links</span>
          <p>${module.glossaryTerms.map((term) => `<button class="inline-term" type="button" data-glossary-term="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join('')}</p>
        </article>
      </div>
    `;

    this.bindLessonEvents(module);
  }

  renderModeContent(module) {
    if (this.progress.selectedMode === 'practice') {
      return `
        <section class="mode-panel">
          <strong>Practice mode</strong>
          <p>Focus on questions, mini-experiments, and practice tasks. Use the simulator buttons below, then return here and explain what changed.</p>
        </section>
      `;
    }
    if (this.progress.selectedMode === 'revise') {
      return `
        <section class="mode-panel revise">
          <strong>Revision summary</strong>
          <p><b>Core idea:</b> ${escapeHtml(module.keyIdeas[0])}</p>
          <p><b>Misconception:</b> ${escapeHtml(module.misconception)}</p>
          <p><b>Useful terms:</b> ${module.glossaryTerms.map(escapeHtml).join(', ')}</p>
        </section>
      `;
    }
    if (this.progress.selectedMode === 'teacher' || this.progress.teacherMode) {
      return `
        <section class="mode-panel teacher">
          <strong>Teacher demo mode</strong>
          <p><b>Estimated time:</b> ${escapeHtml(module.estimatedTime)}</p>
          <ul>${listItems(module.teacherPrompts)}</ul>
          <p><b>Common student mistake:</b> ${escapeHtml(module.misconception)}</p>
        </section>
      `;
    }
    return `
      <section class="mode-panel">
        <strong>Learn mode</strong>
        <p>Read the objectives, inspect the diagram, then use the linked simulator action to connect the concept to a visible change.</p>
      </section>
    `;
  }

  renderSpecialModuleContent(module) {
    if (module.id === 'maps') {
      return `
        <article class="lesson-card map-interpreter">
          <span>Interactive map interpretation</span>
          <div class="map-mode-buttons">
            <button type="button" data-map-info="IPF orientation map">IPF orientation</button>
            <button type="button" data-map-info="Pattern quality map">Pattern quality</button>
            <button type="button" data-map-info="Confidence map">Confidence</button>
            <button type="button" data-map-info="Unindexed pixels map">Unindexed</button>
            <button type="button" data-map-info="Grain boundary overlay">Boundaries</button>
          </div>
          <div class="mini-map-preview" id="miniMapPreview"></div>
          <p id="mapInterpretationText">Choose a map type to see what it means and what students should observe.</p>
        </article>
      `;
    }
    if (module.id === 'troubleshooting') {
      return `
        <article class="lesson-card troubleshooting-guide">
          <span>Troubleshooting cards</span>
          ${module.troubleshootingCards.map((card) => `
            <details>
              <summary>${escapeHtml(card.problem)}</summary>
              <p><b>Symptom:</b> ${escapeHtml(card.symptom)}</p>
              <p><b>Likely causes:</b> ${escapeHtml(card.causes)}</p>
              <p><b>First fix:</b> ${escapeHtml(card.fix)}</p>
              <p><b>Observe:</b> ${escapeHtml(card.observe)}</p>
            </details>
          `).join('')}
        </article>
      `;
    }
    return '';
  }

  renderQuiz(module) {
    const questions = module.quizQuestions;
    const question = questions[this.selectedQuestionIndex] || questions[0];
    const score = this.progress.quizScores[module.id] || { correct: 0, total: 0 };
    return `
      <article class="lesson-card quiz-card">
        <span>Checkpoint quiz</span>
        <div class="quiz-topline">
          <strong>Question ${this.selectedQuestionIndex + 1} of ${questions.length}</strong>
          <small>Score: ${score.correct}/${score.total}</small>
        </div>
        <p>${escapeHtml(question.question)}</p>
        <div class="quiz-options">
          ${question.options.map((option, index) => `<button type="button" data-quiz-option="${index}">${escapeHtml(option)}</button>`).join('')}
        </div>
        <b id="learningQuizFeedback"></b>
        <div class="quiz-nav">
          <button id="tryQuestionAgain" type="button">Try again</button>
          <button id="nextQuizQuestion" type="button">Next question</button>
        </div>
        <div id="reviewMistakes" class="review-mistakes"></div>
      </article>
    `;
  }

  bindLessonEvents(module) {
    this.lessonWorkspace.querySelector('#markModuleComplete').addEventListener('click', () => {
      if (!this.progress.completedModules.includes(module.id)) this.progress.completedModules.push(module.id);
      this.progress.inProgressModules = this.progress.inProgressModules.filter((id) => id !== module.id);
      this.save();
      this.render();
    });

    this.lessonWorkspace.querySelector('#bookmarkModule').addEventListener('click', () => {
      const isBookmarked = this.progress.bookmarks.includes(module.id);
      this.progress.bookmarks = isBookmarked
        ? this.progress.bookmarks.filter((id) => id !== module.id)
        : [...this.progress.bookmarks, module.id];
      this.save();
      this.render();
    });

    this.lessonWorkspace.querySelector('#saveModuleNote').addEventListener('click', () => {
      this.progress.notes[module.id] = this.lessonWorkspace.querySelector('#moduleNotes').value;
      this.save();
    });
    this.lessonWorkspace.querySelector('#clearModuleNote').addEventListener('click', () => {
      delete this.progress.notes[module.id];
      this.save();
      this.render();
    });

    this.lessonWorkspace.querySelectorAll('[data-experiment]').forEach((button) => {
      button.addEventListener('click', () => this.onExperiment(button.dataset.experiment));
    });

    this.lessonWorkspace.querySelectorAll('[data-learning-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        this.progress.selectedMode = button.dataset.learningMode;
        this.save();
        this.renderLesson();
      });
    });

    this.lessonWorkspace.querySelectorAll('[data-map-info]').forEach((button) => {
      button.addEventListener('click', () => this.showMapInterpretation(button.dataset.mapInfo));
    });

    this.lessonWorkspace.querySelectorAll('[data-glossary-term]').forEach((button) => {
      button.addEventListener('click', () => {
        this.glossaryQuery = button.dataset.glossaryTerm;
        this.renderGlossary();
      });
    });

    this.lessonWorkspace.querySelectorAll('[data-quiz-option]').forEach((button) => {
      button.addEventListener('click', () => this.answerQuiz(module, Number(button.dataset.quizOption)));
    });
    this.lessonWorkspace.querySelector('#nextQuizQuestion').addEventListener('click', () => {
      this.selectedQuestionIndex = (this.selectedQuestionIndex + 1) % module.quizQuestions.length;
      this.renderLesson();
    });
    this.lessonWorkspace.querySelector('#tryQuestionAgain').addEventListener('click', () => this.renderLesson());
  }

  showMapInterpretation(label) {
    const descriptions = {
      'IPF orientation map': 'IPF maps encode orientation as color. A color change does not automatically mean a phase change.',
      'Pattern quality map': 'Pattern quality highlights where diffraction patterns are strong or weak. Dark regions may reflect boundaries, strain, surface damage, or poor signal.',
      'Confidence map': 'Confidence maps show how reliable the indexing decision is, not just how bright the pattern looks.',
      'Unindexed pixels map': 'Unindexed pixels show where the software rejected the solution. They can reveal weak patterns, wrong phase, or strict thresholds.',
      'Grain boundary overlay': 'Boundary overlays help connect orientation changes with microstructure. They should be interpreted with quality and confidence maps.'
    };
    const preview = this.lessonWorkspace.querySelector('#miniMapPreview');
    const text = this.lessonWorkspace.querySelector('#mapInterpretationText');
    if (!preview || !text) return;
    preview.dataset.mode = label;
    text.textContent = descriptions[label];
  }

  answerQuiz(module, selectedIndex) {
    const question = module.quizQuestions[this.selectedQuestionIndex];
    const isCorrect = selectedIndex === question.answerIndex;
    const score = this.progress.quizScores[module.id] || { correct: 0, total: 0 };
    score.total += 1;
    if (isCorrect) score.correct += 1;
    this.progress.quizScores[module.id] = score;
    if (!isCorrect) {
      const mistakes = this.progress.quizMistakes[module.id] || [];
      mistakes.push({ question: question.question, selected: question.options[selectedIndex], correct: question.options[question.answerIndex] });
      this.progress.quizMistakes[module.id] = mistakes.slice(-5);
    }
    this.save();

    this.lessonWorkspace.querySelectorAll('[data-quiz-option]').forEach((button) => {
      const index = Number(button.dataset.quizOption);
      button.classList.toggle('correct', index === question.answerIndex);
      button.classList.toggle('incorrect', index === selectedIndex && !isCorrect);
    });
    this.lessonWorkspace.querySelector('#learningQuizFeedback').textContent = `${isCorrect ? 'Correct.' : 'Not quite.'} ${question.feedback}`;
    const mistakes = this.progress.quizMistakes[module.id] || [];
    this.lessonWorkspace.querySelector('#reviewMistakes').innerHTML = mistakes.length
      ? `<strong>Review mistakes</strong><ul>${mistakes.map((m) => `<li>${escapeHtml(m.question)} Correct: ${escapeHtml(m.correct)}</li>`).join('')}</ul>`
      : '';
    this.renderModuleList();
  }

  renderGlossary() {
    const query = this.glossaryQuery.toLowerCase();
    const terms = glossaryTerms.filter((entry) => {
      const matchesQuery = !query || entry.term.toLowerCase().includes(query) || entry.definition.toLowerCase().includes(query);
      const matchesCategory = this.glossaryCategory === 'all' || entry.category === this.glossaryCategory;
      return matchesQuery && matchesCategory;
    });
    const selected = terms[0] || glossaryTerms[0];
    this.miniGlossary.innerHTML = `
      <input id="glossarySearch" class="glossary-search" type="search" placeholder="Search glossary..." value="${escapeHtml(this.glossaryQuery)}" />
      <select id="glossaryCategory">
        ${glossaryCategories.map((category) => `<option value="${category}" ${category === this.glossaryCategory ? 'selected' : ''}>${category}</option>`).join('')}
      </select>
      <div class="glossary-layout">
        <div class="glossary-term-list">
          ${terms.map((entry) => `<button type="button" data-select-term="${escapeHtml(entry.term)}">${escapeHtml(entry.term)}</button>`).join('')}
        </div>
        <article class="selected-term">
          <strong>${escapeHtml(selected.term)}</strong>
          <p>${escapeHtml(selected.definition)}</p>
          <small>Related: ${selected.related.map(escapeHtml).join(', ')}</small>
          <small>Modules: ${selected.modules.map(escapeHtml).join(', ')}</small>
        </article>
      </div>
    `;

    this.miniGlossary.querySelector('#glossarySearch').addEventListener('input', (event) => {
      this.glossaryQuery = event.target.value;
      this.renderGlossary();
    });
    this.miniGlossary.querySelector('#glossaryCategory').addEventListener('change', (event) => {
      this.glossaryCategory = event.target.value;
      this.renderGlossary();
    });
    this.miniGlossary.querySelectorAll('[data-select-term]').forEach((button) => {
      button.addEventListener('click', () => {
        this.glossaryQuery = button.dataset.selectTerm;
        this.renderGlossary();
      });
    });
  }

  renderFormula() {
    this.formulaPanel.innerHTML = `
      <div class="formula">${escapeHtml(formulaReference.bragg)}</div>
      <div class="formula small">${escapeHtml(formulaReference.wavelength)}</div>
      <div class="formula-explorer">
        <label><span>Voltage <output id="formulaVoltageValue">20 kV</output></span><input id="formulaVoltage" type="range" min="5" max="30" step="1" value="20" /></label>
        <label><span>d-spacing <output id="formulaSpacingValue">0.120 nm</output></span><input id="formulaSpacing" type="range" min="0.06" max="0.30" step="0.005" value="0.120" /></label>
        <label><span>Order n <output id="formulaOrderValue">1</output></span><input id="formulaOrder" type="range" min="1" max="3" step="1" value="1" /></label>
        <div class="formula-result" id="formulaResult"></div>
      </div>
      <ul>${listItems(formulaReference.constants)}</ul>
      <p>${escapeHtml(formulaReference.notes)}</p>
    `;
    this.bindFormulaExplorer();
  }

  bindFormulaExplorer() {
    const voltage = this.formulaPanel.querySelector('#formulaVoltage');
    const spacing = this.formulaPanel.querySelector('#formulaSpacing');
    const order = this.formulaPanel.querySelector('#formulaOrder');
    const update = () => {
      const voltageKv = Number(voltage.value);
      const dNm = Number(spacing.value);
      const n = Number(order.value);
      const lambdaPm = electronWavelengthPm(voltageKv);
      const lambdaNm = lambdaPm * 0.001;
      const ratio = Math.min(0.999999, (n * lambdaNm) / (2 * dNm));
      const thetaDeg = Math.asin(ratio) * 180 / Math.PI;
      const conceptualBandWidth = thetaDeg * 2;
      this.formulaPanel.querySelector('#formulaVoltageValue').textContent = `${voltageKv} kV`;
      this.formulaPanel.querySelector('#formulaSpacingValue').textContent = `${dNm.toFixed(3)} nm`;
      this.formulaPanel.querySelector('#formulaOrderValue').textContent = `${n}`;
      this.formulaPanel.querySelector('#formulaResult').innerHTML = `
        <b>${lambdaPm.toFixed(2)} pm (${lambdaNm.toFixed(4)} nm)</b>
        <span>electron wavelength</span>
        <b>${thetaDeg.toFixed(2)} deg</b>
        <span>Bragg angle theta</span>
        <b>${conceptualBandWidth.toFixed(2)} deg</b>
        <span>conceptual band-width idea</span>
        <p>Higher accelerating voltage gives shorter electron wavelength. This explorer is conceptual, not a precision EBSD calculator.</p>
      `;
    };
    [voltage, spacing, order].forEach((input) => input.addEventListener('input', update));
    update();
  }

  bindTeacherToggle() {
    const toggle = document.getElementById('teacherMode');
    if (!toggle) return;
    toggle.checked = Boolean(this.progress.teacherMode);
    toggle.onchange = () => {
      this.progress.teacherMode = toggle.checked;
      this.progress.selectedMode = toggle.checked ? 'teacher' : this.progress.selectedMode;
      this.save();
      this.renderLesson();
    };
  }
}
