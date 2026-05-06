const STORAGE_KEY = 'ebsdTeachingStudio.learningProgress.v1';

const defaultProgress = {
  selectedModuleId: 'intro',
  completedModules: [],
  inProgressModules: [],
  quizScores: {},
  quizMistakes: {},
  quizAnswers: {},
  bookmarks: [],
  notes: {},
  activityObservations: {},
  completedActivities: [],
  flashcardStatus: {},
  flashcardIndex: {},
  demoReturn: null,
  weakReviewOpen: false,
  selectedMapMode: 'ipf',
  selectedMapRegion: 'grain-a',
  diagnosticSymptom: 'saturated-pattern',
  diagnosticFollowup: '',
  selectedMode: 'learn',
  teacherMode: false,
  helpDismissed: false
};

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export function loadLearningProgress() {
  return { ...defaultProgress, ...safeParse(localStorage.getItem(STORAGE_KEY)) };
}

export function saveLearningProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetLearningProgress() {
  localStorage.removeItem(STORAGE_KEY);
  return loadLearningProgress();
}

export function updateLearningProgress(mutator) {
  const progress = loadLearningProgress();
  mutator(progress);
  saveLearningProgress(progress);
  return progress;
}

export function completionPercent(progress, modules) {
  if (!modules.length) return 0;
  return Math.round((progress.completedModules.length / modules.length) * 100);
}
