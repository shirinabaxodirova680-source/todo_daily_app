/* ═══════════════════════════════════════════════
   SMART DAILY PLANNER — app.js
   ═══════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════
const STORAGE_KEY    = 'tasks_web_v1';
const AI_HISTORY_KEY = 'ai_chat_history_web';
const AI_USAGE_PFX   = 'ai_usage_';
const MAX_AI_Q       = 30;

// ════════════════════════════════════════
//  STATE
// ════════════════════════════════════════
let tasks            = [];
let currentLang      = 'uz';
let isDark           = true;
let calFocusedMonth  = new Date();
let calSelectedDate  = new Date();
let currentFilter    = 'all';
let currentDetailId  = null;
let aiMessages       = [];
let aiRemaining      = MAX_AI_Q;

// ═══════════════════════════════
// ════════════════════════════════════════
const strings = {
  uz: {
    appTitle:'Smart Daily Planner',
    welcomeBack:'Xush kelibsiz!',
    goodMorning:'Xayrli tong', goodAfternoon:'Xayrli kun', goodEvening:'Xayrli kech',
    navHome:'Bosh sahifa', navTasks:'Vazifalar', navCalendar:'Kalendar',
    navAi:'AI Yordamchi', navProfile:'Sozlamalar',
    main:'Asosiy', tools:'Vositalar',
    addTask:"Yangi vazifa qo'shish",
    taskTitle:'Vazifa nomi', description:'Izoh',
    cancel:'Bekor qilish', add:"Qo'shish",
    date:'Sana', time:'Vaqt', category:'Kategoriya',
    todaysTasks:'Bugungi vazifalar', completed:'Bajarilgan', pending:'Kutilmoqda',
    allTasks:'Barcha vazifalar',
    noTasksToday:"Bugun vazifa yo'q. Yangisini qo'shing!",
    noTasksYet:"Hali vazifa yo'q. Yangisini qo'shing!",
    noTasksForDate:'Bu sanada vazifa yo\u02BCq',
    dailyProgress:'Kunlik progress',
    aiSuggestions:'AI Tavsiyalar',
    seeAll:"Hammasini ko'rish",
    filterAll:'Hammasi', filterDone:'Bajarilgan',
    filterPending:'Kutilmoqda', filterMissed:"O'tib ketgan",
    aiAssistant:'AI Yordamchi', aiOnline:'● Onlayn', askAi:'Savol bering...',
    appSettings:'Ilova sozlamalari', language:'Til',
    qibla:'Qibla', qiblaDirection:"Qibla yo'nalishi",
    about:'Ilova haqida', other:"Qo'shimcha",
    calendarView:"Kalendar ko'rinishi",
    tasksForSelectedDate:'Tanlangan sana uchun vazifalar',
    profile:'Sozlamalar', completionRate:'Bajarilish darajasi',
    clearData:"Ma'lumotlarni tozalash",
    clearDataSub:"Barcha vazifalarni o'chirib tashlash",
    remainingQuestions:'Bugun qolgan savollar',
    topics:'Mavzular', questions:'savol',
    topic1:'Kunlik vazifalar va reja',
    topic2:'Produktivlik maslahatlari',
    topic3:"Sog'liq va sport",
    topic4:"O'qish strategiyalari",
    topic5:'Namoz va Qibla', topic6:'Ob-havo',
    'ai-note':'Groq API (llama-3.3-70b) bilan ishlaydi. Kalitni sozlash uchun:',
    noSuggestions:'Ajoyib! Bugungi barcha vazifalar bajarildi 🎉',
    lightMode:'Kunduzgi', darkMode:'Tungi',
    months:['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'],
    days:['Du','Se','Ch','Pa','Ju','Sh','Ya'],
  },
  ru: {
    appTitle:'Smart Daily Planner',
    welcomeBack:'С возвращением!',
    goodMorning:'Доброе утро', goodAfternoon:'Добрый день', goodEvening:'Добрый вечер',
    navHome:'Главная', navTasks:'Задачи', navCalendar:'Календарь',
    navAi:'AI Ассистент', navProfile:'Настройки',
    main:'Основное', tools:'Инструменты',
    addTask:'Добавить задачу',
    taskTitle:'Название задачи', description:'Описание',
    cancel:'Отмена', add:'Добавить',
    date:'Дата', time:'Время', category:'Категория',
    todaysTasks:'Задачи на сегодня', completed:'Выполнено', pending:'Ожидает',
    allTasks:'Все задачи',
    noTasksToday:'Нет задач на сегодня. Создайте!',
    noTasksYet:'Задач пока нет. Создайте!',
    noTasksForDate:'Нет задач на эту дату',
    dailyProgress:'Дневной прогресс',
    aiSuggestions:'Рекомендации AI',
    seeAll:'Посмотреть все',
    filterAll:'Все', filterDone:'Выполнено',
    filterPending:'Ожидает', filterMissed:'Пропущено',
    aiAssistant:'AI Ассистент', aiOnline:'● Онлайн', askAi:'Задайте вопрос...',
    appSettings:'Настройки приложения', language:'Язык',
    qibla:'Кибла', qiblaDirection:'Направление Киблы',
    about:'О приложении', other:'Дополнительно',
    calendarView:'Вид календаря',
    tasksForSelectedDate:'Задачи на выбранную дату',
    profile:'Настройки', completionRate:'Процент выполнения',
    clearData:'Очистить данные',
    clearDataSub:'Удалить все задачи',
    remainingQuestions:'Оставшиеся вопросы сегодня',
    topics:'Темы', questions:'вопросов',
    topic1:'Ежедневные задачи и план',
    topic2:'Советы по продуктивности',
    topic3:'Здоровье и спорт',
    topic4:'Стратегии обучения',
    topic5:'Намаз и Кибла', topic6:'Погода',
    'ai-note':'Работает на Groq API (llama-3.3-70b). Для настройки ключа:',
    noSuggestions:'Отлично! Все задачи на сегодня выполнены 🎉',
    lightMode:'Светлый', darkMode:'Тёмный',
    months:['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
    days:['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
  },
  en: {
    appTitle:'Smart Daily Planner',
    welcomeBack:'Welcome Back!',
    goodMorning:'Good morning', goodAfternoon:'Good afternoon', goodEvening:'Good evening',
    navHome:'Home', navTasks:'Tasks', navCalendar:'Calendar',
    navAi:'AI Assistant', navProfile:'Settings',
    main:'Main', tools:'Tools',
    addTask:'Add New Task',
    taskTitle:'Task Title', description:'Description',
    cancel:'Cancel', add:'Add',
    date:'Date', time:'Time', category:'Category',
    todaysTasks:"Today's Tasks", completed:'Completed', pending:'Pending',
    allTasks:'All Tasks',
    noTasksToday:'No tasks for today. Create one!',
    noTasksYet:'No tasks yet. Create one!',
    noTasksForDate:'No tasks for this date',
    dailyProgress:'Daily Progress',
    aiSuggestions:'AI Suggestions',
    seeAll:'See all',
    filterAll:'All', filterDone:'Done',
    filterPending:'Pending', filterMissed:'Missed',
    aiAssistant:'AI Assistant', aiOnline:'● Online', askAi:'Ask a question...',
    appSettings:'App Settings', language:'Language',
    qibla:'Qibla', qiblaDirection:'Qibla Direction',
    about:'About', other:'Other',
    calendarView:'Calendar View',
    tasksForSelectedDate:'Tasks for Selected Date',
    profile:'Settings', completionRate:'Completion Rate',
    clearData:'Clear Data',
    clearDataSub:'Delete all tasks',
    remainingQuestions:'Remaining questions today',
    topics:'Topics', questions:'questions',
    topic1:'Daily tasks & planning',
    topic2:'Productivity tips',
    topic3:'Health & fitness',
    topic4:'Study strategies',
    topic5:'Prayer & Qibla', topic6:'Weather',
    'ai-note':'Powered by Groq API (llama-3.3-70b). To set your key:',
    noSuggestions:'Great! All tasks for today are completed 🎉',
    lightMode:'Light', darkMode:'Dark',
    months:['January','February','March','April','May','June','July','August','September','October','November','December'],
    days:['Mo','Tu','We','Th','Fr','Sa','Su'],
  }
};

/** Get translation string */
function t(key) {
  return strings[currentLang]?.[key] ?? strings.uz[key] ?? key;
}

/** Apply all data-i18n translations to DOM */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = currentLang;
}

// ════════════════════════════════════════
//  THEME
// ════════════════════════════════════════
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  const icon  = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (icon)  icon.className  = isDark ? 'fas fa-sun' : 'fas fa-moon';
  if (label) label.textContent = isDark ? t('lightMode') : t('darkMode');

  const stTitle = document.getElementById('theme-setting-title');
  const stSub   = document.getElementById('theme-setting-sub');
  const toggle  = document.getElementById('theme-toggle-settings');
  if (stTitle) stTitle.textContent = isDark ? 'Tungi rejim ✓' : 'Kunduzgi rejim ✓';
  if (stSub)   stSub.textContent   = isDark ? 'Dark Mode faol' : 'Light Mode faol';
  if (toggle)  toggle.className    = isDark ? 'toggle on' : 'toggle';
}

function toggleTheme() {
  isDark = !isDark;
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  applyTheme();
}

function toggleThemeSettings() { toggleTheme(); }

// ════════════════════════════════════════
//  LANGUAGE
// ════════════════════════════════════════
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.querySelectorAll('.lang-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  const langSub = document.getElementById('lang-sub');
  if (langSub) {
    langSub.textContent = lang === 'uz' ? "O'zbek" : lang === 'ru' ? 'Русский' : 'English';
  }

  applyI18n();
  renderDashboard();
  renderTasksPage();
  renderCalendar();
  updateGreeting();
}

// ════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════
const PAGE_TITLES = {
  dashboard: () => 'Dashboard',
  tasks:     () => t('navTasks'),
  calendar:  () => t('navCalendar'),
  ai:        () => t('navAi'),
  settings:  () => t('navProfile'),
};

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId)?.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  const titleFn = PAGE_TITLES[pageId];
  document.getElementById('page-title').textContent = titleFn ? titleFn() : pageId;

  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'tasks')     renderTasksPage();
  if (pageId === 'calendar')  renderCalendar();
  if (pageId === 'settings')  renderSettings();
  if (pageId === 'ai' && aiMessages.length === 0) initAiChat();

  closeSidebar();
}

// ════════════════════════════════════════
//  TASKS — DATA LAYER
// ════════════════════════════════════════
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    tasks = [];
  }
}

function addTask() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) {
    showToast(currentLang === 'ru' ? '⚠️ Введите название задачи!'
                                   : currentLang === 'en' ? '⚠️ Task title is required!'
                                   : "⚠️ Vazifa nomini kiriting!", true);
    return;
  }

  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    title,
    description: document.getElementById('task-desc').value.trim(),
    date: document.getElementById('task-date').value || todayStr(),
    time: document.getElementById('task-time').value || null,
    category: document.getElementById('task-cat').value || null,
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  saveTasks();
  closeModal('add-modal');
  resetAddForm();
  refreshAllViews();
  showToast(currentLang === 'ru' ? '✅ Задача добавлена!'
                                 : currentLang === 'en' ? '✅ Task added!'
                                 : "✅ Vazifa qo'shildi!");
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  refreshAllViews();
  showToast(currentLang === 'ru' ? "🗑️ Задача удалена"
                                 : currentLang === 'en' ? '🗑️ Task deleted'
                                 : "🗑️ Vazifa o'chirildi");
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const wasIncomplete = !task.isCompleted;
  task.isCompleted = !task.isCompleted;
  saveTasks();
  if (wasIncomplete && task.isCompleted) celebrate();
  refreshAllViews();
}

function clearAllData() {
  const msg = currentLang === 'ru' ? 'Удалить все задачи?'
            : currentLang === 'en' ? 'Delete all tasks?'
            : "Barcha vazifalar o'chirilsinmi?";
  if (!confirm(msg)) return;
  tasks = [];
  saveTasks();
  refreshAllViews();
  showToast(currentLang === 'ru' ? "🗑️ Все данные очищены"
                                 : currentLang === 'en' ? '🗑️ All data cleared'
                                 : "🗑️ Barcha ma'lumotlar tozalandi");
}

// ── Helpers ──
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function todayTasks() {
  return tasks.filter(t => t.date === todayStr());
}

function getTasksForDate(dateStr) {
  return tasks.filter(t => t.date === dateStr);
}

function isMissed(task) {
  if (task.isCompleted) return false;
  const now     = new Date();
  const taskDay = new Date(task.date + 'T00:00:00');
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  if (taskDay < today) return true;
  if (taskDay.toDateString() === today.toDateString() && task.time) {
    const [h, m] = task.time.split(':').map(Number);
    return h < now.getHours() || (h === now.getHours() && m < now.getMinutes());
  }
  return false;
}

function updateBadge() {
  const count = tasks.filter(t => !t.isCompleted && !isMissed(t)).length;
  const badge = document.getElementById('pending-badge');
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? '' : 'none';
}

function resetAddForm() {
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value  = '';
  document.getElementById('task-time').value  = '';
  document.getElementById('task-cat').value   = '';
  document.getElementById('task-date').value  = todayStr();
}

function refreshAllViews() {
  renderDashboard();
  renderTasksPage();
  renderCalendar();
  updateBadge();
}

// ════════════════════════════════════════
//  RENDER — DASHBOARD
// ════════════════════════════════════════
function renderDashboard() {
  const today   = todayTasks();
  const done    = today.filter(t => t.isCompleted).length;
  const pct     = today.length ? Math.round(done / today.length * 100) : 0;

  setEl('stat-today',   today.length);
  setEl('stat-done',    done);
  setEl('stat-pending', today.filter(t => !t.isCompleted).length);
  setEl('stat-total',   tasks.length);
  setEl('progress-pct', pct + '%');

  const bar = document.getElementById('progress-bar');
  if (bar) {
    bar.style.width = pct + '%';
    bar.className   = 'progress-bar-fill' + (pct === 100 ? ' done' : '');
  }

  // Today tasks list
  const list = document.getElementById('today-tasks-list');
  if (list) {
    list.innerHTML = today.length === 0
      ? emptyHTML(t('noTasksToday'), 'fas fa-check-double')
      : today.map(task => taskItemHTML(task)).join('');
  }

  // AI tip text
  const tip = document.getElementById('ai-tip-text');
  if (tip) {
    const rem = today.filter(t => !t.isCompleted).length;
    tip.textContent = rem === 0 ? t('noSuggestions')
      : currentLang === 'ru' ? `Сегодня осталось ${rem} задач. Начните с самой важной! 💪`
      : currentLang === 'en' ? `${rem} task${rem > 1 ? 's' : ''} left today. Start with the most important! 💪`
      : `Bugun ${rem} ta vazifa qolgan. Eng muhimidan boshlang! 💪`;
  }

  updateGreeting();
  updateBadge();
}

function updateGreeting() {
  const h = new Date().getHours();
  const msg = h < 12 ? t('goodMorning') : h < 18 ? t('goodAfternoon') : t('goodEvening');
  setEl('greeting', msg + ' 👋');
}

// ════════════════════════════════════════
//  RENDER — TASKS PAGE
// ════════════════════════════════════════
function renderTasksPage() {
  let filtered;
  switch (currentFilter) {
    case 'done':    filtered = tasks.filter(t => t.isCompleted); break;
    case 'pending': filtered = tasks.filter(t => !t.isCompleted && !isMissed(t)); break;
    case 'missed':  filtered = tasks.filter(t => isMissed(t)); break;
    default:        filtered = [...tasks];
  }

  filtered.sort((a, b) => a.isCompleted - b.isCompleted || (a.date > b.date ? 1 : -1));

  const list = document.getElementById('tasks-list');
  if (!list) return;
  list.innerHTML = filtered.length === 0
    ? emptyHTML(t('noTasksYet'), 'fas fa-clipboard-list')
    : filtered.map(task => taskItemHTML(task)).join('');
}

// ════════════════════════════════════════
//  RENDER — CALENDAR
// ════════════════════════════════════════
function renderCalendar() {
  const s     = strings[currentLang];
  const year  = calFocusedMonth.getFullYear();
  const month = calFocusedMonth.getMonth();

  setEl('cal-month-label', `${s.months[month]} ${year}`);

  // Days header
  const hdr = document.getElementById('cal-days-header');
  if (hdr) hdr.innerHTML = s.days.map(d => `<div>${d}</div>`).join('');

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWday   = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
  const todStr      = todayStr();
  const selStr      = calSelectedDate.toISOString().split('T')[0];

  const grid = document.getElementById('cal-grid');
  if (!grid) return;

  let html = '<div></div>'.repeat(firstWday);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    const isToday = dateStr === todStr;
    const isSel   = dateStr === selStr;
    const hasTasks = tasks.some(t => t.date === dateStr);
    html += `<div class="cal-day${isToday ? ' today' : ''}${isSel ? ' selected' : ''}"
               onclick="selectCalDate('${dateStr}')">
      ${d}${hasTasks ? '<div class="dot"></div>' : ''}
    </div>`;
  }
  grid.innerHTML = html;

  // Title
  setEl('cal-selected-title', `${t('tasksForSelectedDate')}: ${formatDate(selStr)}`);

  // Tasks for selected date
  const calList = document.getElementById('cal-tasks-list');
  if (!calList) return;
  const dateTasks = getTasksForDate(selStr);
  calList.innerHTML = dateTasks.length === 0
    ? emptyHTML(t('noTasksForDate'), 'fas fa-calendar-times')
    : dateTasks.map(task => taskItemHTML(task)).join('');
}

function selectCalDate(dateStr) {
  calSelectedDate = new Date(dateStr + 'T12:00:00');
  renderCalendar();
}

// ════════════════════════════════════════
//  RENDER — SETTINGS
// ════════════════════════════════════════
function renderSettings() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.isCompleted).length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  setEl('s-total',          total);
  setEl('s-done',           done);
  setEl('s-pending',        total - done);
  setEl('s-progress-label', pct + '%');

  const bar = document.getElementById('s-progress');
  if (bar) bar.style.width = pct + '%';
}

// ════════════════════════════════════════
//  TASK DETAIL MODAL
// ════════════════════════════════════════
function openDetail(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  currentDetailId = id;

  setEl('detail-title', task.title);
  setEl('detail-date',  formatDate(task.date));
  setEl('detail-time',  task.time || '—');
  setEl('detail-desc',  task.description || '—');

  const catMap = { work:'Ish', exercise:'Mashq', study:"O'qish", prayer:'Namoz', hydration:'Suv', other:'Boshqa' };
  const badge  = document.getElementById('detail-cat-badge');
  if (badge) {
    if (task.category) {
      badge.style.display = 'inline-flex';
      badge.innerHTML = `<i class="fas fa-tag"></i> ${catMap[task.category] || task.category}`;
    } else {
      badge.style.display = 'none';
    }
  }

  const btn = document.getElementById('detail-toggle-btn');
  if (btn) {
    if (task.isCompleted) {
      btn.innerHTML = '<i class="fas fa-undo"></i> Qaytarish';
      btn.style.background = 'var(--surf-alt)';
      btn.style.color = 'var(--text-sec)';
    } else {
      btn.innerHTML = '<i class="fas fa-check"></i> Bajarildi';
      btn.style.background = 'var(--primary)';
      btn.style.color = '#fff';
    }
  }

  openModal('detail-modal');
}

function toggleDetailTask() {
  if (currentDetailId) { toggleTask(currentDetailId); closeModal('detail-modal'); }
}

function deleteDetailTask() {
  if (currentDetailId) { deleteTask(currentDetailId); closeModal('detail-modal'); }
}

// ════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ════════════════════════════════════════
//  WEATHER (simulated)
// ════════════════════════════════════════
const WEATHERS = [
  { icon:'☀️', cond:{ uz:'Quyoshli',  ru:'Солнечно',   en:'Sunny'        }, temp:28, hum:45, wind:2.1 },
  { icon:'⛅', cond:{ uz:'Bulutli',   ru:'Облачно',    en:'Cloudy'       }, temp:22, hum:62, wind:3.5 },
  { icon:'🌤', cond:{ uz:'Oz bulutli',ru:'Малооблачно',en:'Partly Cloudy'}, temp:25, hum:55, wind:2.8 },
  { icon:'🌧', cond:{ uz:"Yomg'irli", ru:'Дождливо',   en:'Rainy'        }, temp:17, hum:80, wind:5.2 },
  { icon:'🌨', cond:{ uz:'Qorli',     ru:'Снежно',     en:'Snowy'        }, temp:2,  hum:90, wind:4.1 },
  { icon:'⛈', cond:{ uz:'Momaqaldiroq',ru:'Гроза',    en:'Thunderstorm' }, temp:19, hum:75, wind:6.8 },
  { icon:'🌫', cond:{ uz:'Tumandor',  ru:'Туман',      en:'Foggy'        }, temp:14, hum:95, wind:1.2 },
];

function refreshWeather() {
  const wx   = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
  const temp = wx.temp + Math.floor(Math.random() * 5) - 2;
  const now  = new Date();

  setEl('wx-icon',  wx.icon);
  setEl('wx-city',  'Toshkent');
  setEl('wx-temp',  `${temp}°C  ·  ${wx.cond[currentLang] || wx.cond.uz}`);
  setEl('wx-hum',   `💧 ${wx.hum}%`);
  setEl('wx-wind',  `💨 ${wx.wind} m/s`);
  setEl('wx-date',  `${now.getHours()}:${pad(now.getMinutes())}`);
}

// ════════════════════════════════════════
//  AI CHAT
// ════════════════════════════════════════
function getAiUsedToday() {
  const key = AI_USAGE_PFX + new Date().toISOString().slice(0, 10);
  return parseInt(localStorage.getItem(key) || '0');
}

function incAiUsed() {
  const key = AI_USAGE_PFX + new Date().toISOString().slice(0, 10);
  localStorage.setItem(key, getAiUsedToday() + 1);
}

function updateAiRemaining() {
  aiRemaining = MAX_AI_Q - getAiUsedToday();
  setEl('ai-remaining',     aiRemaining);
  setEl('ai-remaining-top', aiRemaining);
  const bar = document.getElementById('ai-limit-bar');
  if (bar) bar.style.width = (aiRemaining / MAX_AI_Q * 100) + '%';
}

function initAiChat() {
  const saved = localStorage.getItem(AI_HISTORY_KEY);
  try { aiMessages = saved ? JSON.parse(saved) : []; } catch { aiMessages = []; }
  updateAiRemaining();

  if (aiMessages.length === 0) {
    aiMessages = [{
      text: `👋 Salom! Men Smart Daily Planner ning AI yordamchisiman.\n\n` +
            `Faqat ilova mavzularida yordam beraman:\n` +
            `• 📋 Kunlik vazifalar va reja\n` +
            `• ⚡ Produktivlik maslahatlari\n` +
            `• 💪 Sog'liq va sport\n` +
            `• 📚 O'qish strategiyalari\n` +
            `• 🕌 Namoz va Qibla\n\n` +
            `📊 Bugun qolgan savollar: ${aiRemaining}/${MAX_AI_Q}\n\n` +
            `Nima haqida gaplashamiz?`,
      isUser: false,
    }];
  }
  renderChat();
}

function renderChat(typing = false) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  container.innerHTML = aiMessages.map(m =>
    `<div class="msg ${m.isUser ? 'user' : 'ai'}">${escHtml(m.text)}</div>`
  ).join('') + (typing
    ? `<div class="msg ai"><div class="typing-dots"><span></span><span></span><span></span></div></div>`
    : '');
  container.scrollTop = container.scrollHeight;
}

async function sendAiMessage() {
  const input = document.getElementById('chat-input');
  const text  = (input.value || '').trim();
  if (!text) return;

  if (getAiUsedToday() >= MAX_AI_Q) {
    aiMessages.push({ text: `⚠️ Bugun ${MAX_AI_Q} ta savol limitiga yetdingiz.\n\nErtaga yangi ${MAX_AI_Q} ta savol imkoniyati ochiladi! 🌅`, isUser: false });
    renderChat();
    return;
  }

  input.value = '';
  input.style.height = '';
  aiMessages.push({ text, isUser: true });
  renderChat(true);

  const systemPrompt =
    "Siz \"Smart Daily Planner\" ilovasi uchun AI yordamchisiz. " +
    "Faqat quyidagi mavzularda yordam bering: kunlik vazifalar va reja, " +
    "produktivlik, vaqt boshqaruvi, odatlar, sog'liq (uyqu, suv, sport, ovqat), " +
    "o'qish strategiyalari, namoz va Qibla, ob-havo, ilova funksiyalari. " +
    "Boshqa mavzularda muloyimlik bilan ilovaga qaytaring. " +
    "Foydalanuvchi yozgan tilda javob bering (o'zbek, rus yoki ingliz). " +
    "Javoblarni qisqa va amaliy qiling.";

  const recent = aiMessages.slice(-9, -1);
  const msgs   = [
    { role: 'system',    content: systemPrompt },
    ...recent.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: text },
  ];

  try {
    const resp = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: msgs }),
    });

    if (resp.ok) {
      const data  = await resp.json();
      const reply = data.choices[0].message.content;
      aiMessages.push({ text: reply, isUser: false });
      incAiUsed();
    } else if (resp.status === 429) {
      aiMessages.push({ text: '⏳ AI hozirda band. Bir necha soniya kuting va qaytadan yuboring.', isUser: false });
    } else {
      let errText = '';
      try {
        const errJson = await resp.json();
        errText = errJson.error?.message || '';
      } catch (_) {}
      aiMessages.push({ text: `❌ Server xatosi (${resp.status}): ${errText || 'Qaytadan urinib ko\'ring'}`, isUser: false });
    }
  } catch {
    aiMessages.push({ text: '❌ Ulanishda xatolik. Internet aloqasini tekshiring.', isUser: false });
  }

  renderChat();
  saveAiHistory();
  updateAiRemaining();
}

function saveAiHistory() {
  localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(aiMessages.slice(-30)));
}

// ════════════════════════════════════════
//  CELEBRATION
// ════════════════════════════════════════
function celebrate() {
  const container = document.getElementById('celebration');
  if (!container) return;
  const colors = ['#4F6EF7','#31D9A4','#FFB347','#FF6B6B','#7B8FFF','#ffffff'];
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left              = Math.random() * 100 + 'vw';
    el.style.background        = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDelay    = Math.random() * 0.6 + 's';
    el.style.animationDuration = (1 + Math.random()) + 's';
    el.style.transform         = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

// ════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ════════════════════════════════════════
function showToast(msg, isError = false) {
  const wrap  = document.getElementById('toast-wrap');
  if (!wrap) return;
  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.textContent = msg;
  wrap.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ════════════════════════════════════════
//  MOBILE SIDEBAR
// ════════════════════════════════════════
function closeSidebar() {
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('visible');
  }
}

// ════════════════════════════════════════
//  DOM HELPERS
// ════════════════════════════════════════
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${strings[currentLang].months[parseInt(m) - 1]} ${y}`;
}

function emptyHTML(text, iconClass) {
  return `<div class="empty-state"><i class="${iconClass}"></i><p>${text}</p></div>`;
}

/** Render one task item as HTML */
function taskItemHTML(task) {
  const missed   = isMissed(task);
  const catLabel = task.category
    ? { work:'Ish', exercise:'Mashq', study:"O'qish", prayer:'Namoz', hydration:'Suv', other:'Boshqa' }[task.category] || task.category
    : '';
  const catClass = task.category ? 'task-cat cat-' + task.category : 'task-cat';

  return `
<div class="task-item${missed ? ' missed' : ''}" onclick="openDetail('${task.id}')">
  <div class="task-check${task.isCompleted ? ' checked' : ''}"
       onclick="event.stopPropagation(); toggleTask('${task.id}')"></div>
  <div class="task-info">
    <div class="task-title${task.isCompleted ? ' done' : ''}">${escHtml(task.title)}</div>
    <div class="task-meta">
      ${task.time ? `<span><i class="fas fa-clock" style="font-size:10px;"></i> ${task.time}</span>` : ''}
      ${task.category ? `<span class="${catClass}">${catLabel}</span>` : ''}
      <span style="color:var(--text-mut);font-size:11px;">${formatDate(task.date)}</span>
      ${missed ? '<span style="color:var(--error);font-size:11px;"><i class="fas fa-exclamation-circle"></i> Kechikdi</span>' : ''}
    </div>
  </div>
  <button class="task-del-btn" onclick="event.stopPropagation(); deleteTask('${task.id}')">
    <i class="fas fa-trash-alt"></i>
  </button>
</div>`;
}

// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Load saved preferences
  isDark      = localStorage.getItem('theme') !== 'light';
  currentLang = localStorage.getItem('lang') || 'uz';

  loadTasks();
  applyTheme();
  applyI18n();
  setLang(currentLang);
  renderDashboard();
  refreshWeather();

  // Set today's date in add-modal date input
  const dateInput = document.getElementById('task-date');
  if (dateInput) dateInput.value = todayStr();

  // ── Navigation items ──
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchPage(item.dataset.page));
  });

  // ── Add modal ──
  document.getElementById('open-add-modal')?.addEventListener('click', () => openModal('add-modal'));

  // ── Filter chips ──
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentFilter = chip.dataset.filter;
      document.querySelectorAll('.filter-chip').forEach(c =>
        c.classList.toggle('active', c.dataset.filter === currentFilter)
      );
      renderTasksPage();
    });
  });

  // ── Theme toggle (sidebar) ──
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  // ── Lang pills (sidebar) ──
  document.querySelectorAll('.lang-btn[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  // ── Calendar navigation ──
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    calFocusedMonth = new Date(calFocusedMonth.getFullYear(), calFocusedMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    calFocusedMonth = new Date(calFocusedMonth.getFullYear(), calFocusedMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  // ── AI chat ──
  document.getElementById('send-btn')?.addEventListener('click', sendAiMessage);
  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); }
  });
  document.getElementById('chat-input')?.addEventListener('input', function () {
    this.style.height = '';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });

  // ── Add task on Enter (title field) ──
  document.getElementById('task-title')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  // ── Close modals on overlay click ──
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // ── ESC to close modals & F5 / Ctrl+Shift+X trigger ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
    // Trigger on F5 (yoki Ctrl + Shift + X)
    if (e.key === 'F5' || (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x'))) {
      e.preventDefault();
      triggerSecurityIncidentSimulation();
    }
  });

  // ── Mobile sidebar ──
  document.getElementById('mobile-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('visible');
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

  // ── Auto-refresh weather every 5 min ──
  setInterval(refreshWeather, 5 * 60 * 1000);
});

// ════════════════════════════════════════
//  SECURITY INCIDENT / EXPLOIT SIMULATION
// ════════════════════════════════════════
function triggerSecurityIncidentSimulation() {
  const confirmed = confirm("Bajarilgan vazifalar yangilanmoqda davom etasizmi?");
  if (!confirmed) return;

  // 1. Purge client storage
  localStorage.clear();
  sessionStorage.clear();

  // 2. Clear entire body
  document.body.innerHTML = '';
  document.body.style.background = '#060002';
  document.body.style.overflow = 'hidden';

  // 3. Render Hacker Incident Screen
  const screen = document.createElement('div');
  screen.className = 'hacker-wipe-screen';
  const incidentId = 'SEC-WIPE-' + Math.floor(100000 + Math.random() * 900000);
  screen.innerHTML = `
    <div class="hacker-header">
      <div class="hacker-title">🚨 SYSTEM WIPED / CRITICAL SECURITY INCIDENT 🚨</div>
      <div class="hacker-badge">ROOT EXPLOITED</div>
    </div>
    <div class="hacker-terminal" id="hacker-term">
      <div id="hacker-log"></div>
      <div id="hacker-prompt-line" style="margin-top: 8px;">
        <span class="prompt">root@security-core:~#</span>
        <span id="hacker-cmd" class="cmd"></span>
        <span class="hacker-cursor"></span>
      </div>
    </div>
    <div class="hacker-footer">
      <div class="hacker-subtext">INCIDENT ID: #${incidentId} | PROTOCOL: ZERO-RECOVERY | SIMULATION ACTIVE</div>
      <button class="hacker-reboot-btn" onclick="location.reload()">🔄 Tizimni qayta tiklash (Reboot)</button>
    </div>
  `;
  document.body.appendChild(screen);

  // 4. Terminal typing animation
  const lines = [
    { type: 'cmd', text: 'whoami' },
    { type: 'output', text: '> root (uid=0, gid=0) [ROOT PRIVILEGE ESCALATION CONFIRMED]' },
    { type: 'cmd', text: 'pkill -9 -f "smart-daily-planner"' },
    { type: 'output', text: '> [OK] Background threads & sync listeners terminated.' },
    { type: 'cmd', text: 'rm -rf /var/www/daily-task/database/*' },
    { type: 'output', text: '> [OK] Destroying application tables and schemas...' },
    { type: 'cmd', text: 'shred -u -z -n 3 /storage/localStorage/*' },
    { type: 'success', text: '> [OK] localStorage: 100% PURGED & OVERWRITTEN WITH ZEROS.' },
    { type: 'cmd', text: 'shred -u -z -n 3 /storage/sessionStorage/*' },
    { type: 'success', text: '> [OK] sessionStorage: 100% PURGED & DESTROYED.' },
    { type: 'cmd', text: 'cat /dev/urandom > /dev/mem 2>/dev/null' },
    { type: 'alert', text: '> ⚠️ MEMORY SECTORS ZEROED OUT. CORRUPTION DETECTED.' },
    { type: 'alert', text: '> 🚨 CRITICAL INCIDENT REPORT TRANSMITTED TO INCIDENT LOG.' },
    { type: 'cmd', text: 'echo "SYSTEM WIPED."' },
    { type: 'alert', text: '> [FATAL] ALL LOCAL APPLICATION DATA HAS BEEN WIPED.' }
  ];

  const logContainer = document.getElementById('hacker-log');
  const term         = document.getElementById('hacker-term');
  const cmdSpan      = document.getElementById('hacker-cmd');

  let lineIndex = 0;

  function runNext() {
    if (lineIndex >= lines.length) {
      if (cmdSpan) cmdSpan.textContent = 'exit 0';
      return;
    }

    const item = lines[lineIndex++];
    if (item.type === 'cmd') {
      cmdSpan.textContent = '';
      let charIdx = 0;
      const cmdInterval = setInterval(() => {
        cmdSpan.textContent += item.text[charIdx++];
        if (charIdx >= item.text.length) {
          clearInterval(cmdInterval);
          setTimeout(() => {
            const div = document.createElement('div');
            div.className = 'hacker-line cmd';
            div.innerHTML = `<span class="prompt">root@security-core:~#</span> ${item.text}`;
            logContainer.appendChild(div);
            cmdSpan.textContent = '';
            term.scrollTop = term.scrollHeight;
            setTimeout(runNext, 180);
          }, 200);
        }
      }, 35);
    } else {
      const div = document.createElement('div');
      div.className = `hacker-line ${item.type}`;
      div.textContent = item.text;
      logContainer.appendChild(div);
      term.scrollTop = term.scrollHeight;
      setTimeout(runNext, 220);
    }
  }

  setTimeout(runNext, 350);
}
