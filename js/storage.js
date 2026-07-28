/**
 * LocalStorage 키 상수 및 CRUD 헬퍼
 * 모든 앱 데이터는 이 모듈을 통해 읽고 씁니다.
 */

const STORAGE_KEYS = {
  EMPLOYEES: 'rcd_employees',
  SCHEDULES: 'rcd_schedules',
  SESSION: 'rcd_session',
  SWAP_REQUESTS: 'rcd_swap_requests',
  LANGUAGE: 'rcd_language',
  THEME: 'rcd_theme',
  DUTY_HISTORY: 'rcd_duty_history',
  INITIALIZED: 'rcd_initialized',
  REVEALED_WEEKS: 'rcd_revealed_weeks',
  AUTO_ASSIGNED: 'rcd_auto_assigned'
};

/**
 * LocalStorage에서 JSON 값을 읽어 파싱합니다.
 * @param {string} key - 저장 키
 * @param {*} fallback - 값이 없을 때 반환할 기본값
 * @returns {*} 파싱된 값 또는 fallback
 */
function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error('storageGet error:', key, err);
    return fallback;
  }
}

/**
 * LocalStorage에 JSON 값을 저장합니다.
 * @param {string} key - 저장 키
 * @param {*} value - 직렬화할 값
 */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('storageSet error:', key, err);
  }
}

/**
 * LocalStorage에서 키를 삭제합니다.
 * @param {string} key - 삭제할 키
 */
function storageRemove(key) {
  localStorage.removeItem(key);
}

/**
 * 직원 목록을 반환합니다.
 * @returns {Array} 직원 배열
 */
function getEmployees() {
  return storageGet(STORAGE_KEYS.EMPLOYEES, []);
}

/**
 * 직원 목록을 저장합니다.
 * @param {Array} employees - 직원 배열
 */
function saveEmployees(employees) {
  storageSet(STORAGE_KEYS.EMPLOYEES, employees);
}

/**
 * 전체 일정 맵을 반환합니다. 키 형식: "YYYY-MM"
 * @returns {Object} 월별 일정 객체
 */
function getSchedules() {
  return storageGet(STORAGE_KEYS.SCHEDULES, {});
}

/**
 * 특정 월의 일정을 반환합니다.
 * @param {string} yearMonth - "YYYY-MM"
 * @returns {Array} 해당 월 일정 배열
 */
function getScheduleByMonth(yearMonth) {
  const all = getSchedules();
  return all[yearMonth] || [];
}

/**
 * 특정 월 일정을 저장합니다.
 * @param {string} yearMonth - "YYYY-MM"
 * @param {Array} days - 일정 배열
 */
function saveScheduleByMonth(yearMonth, days) {
  const all = getSchedules();
  all[yearMonth] = days;
  storageSet(STORAGE_KEYS.SCHEDULES, all);
}

/**
 * 로그인 세션을 반환합니다.
 * @returns {Object|null} 세션 객체
 */
function getSession() {
  return storageGet(STORAGE_KEYS.SESSION, null);
}

/**
 * 로그인 세션을 저장합니다.
 * @param {Object} session - { role, username, employeeId?, name? }
 */
function saveSession(session) {
  storageSet(STORAGE_KEYS.SESSION, session);
}

/**
 * 로그인 세션을 삭제합니다.
 */
function clearSession() {
  storageRemove(STORAGE_KEYS.SESSION);
}

/**
 * 교환 요청 목록을 반환합니다.
 * @returns {Array} 교환 요청 배열
 */
function getSwapRequests() {
  return storageGet(STORAGE_KEYS.SWAP_REQUESTS, []);
}

/**
 * 교환 요청 목록을 저장합니다.
 * @param {Array} requests - 교환 요청 배열
 */
function saveSwapRequests(requests) {
  storageSet(STORAGE_KEYS.SWAP_REQUESTS, requests);
}

/**
 * 언어 설정을 반환합니다. ('ko' | 'zh')
 * @returns {string}
 */
function getLanguage() {
  return storageGet(STORAGE_KEYS.LANGUAGE, 'ko');
}

/**
 * 언어 설정을 저장합니다.
 * @param {string} lang - 'ko' | 'zh'
 */
function saveLanguage(lang) {
  storageSet(STORAGE_KEYS.LANGUAGE, lang);
}

/**
 * 테마 설정을 반환합니다. ('light' | 'dark')
 * @returns {string}
 */
function getTheme() {
  return storageGet(STORAGE_KEYS.THEME, 'light');
}

/**
 * 테마 설정을 저장합니다.
 * @param {string} theme - 'light' | 'dark'
 */
function saveTheme(theme) {
  storageSet(STORAGE_KEYS.THEME, theme);
}

/**
 * 월별 담당 횟수 이력을 반환합니다.
 * 형식: { "YYYY-MM": { employeeId: count } }
 * @returns {Object}
 */
function getDutyHistory() {
  return storageGet(STORAGE_KEYS.DUTY_HISTORY, {});
}

/**
 * 월별 담당 횟수 이력을 저장합니다.
 * @param {Object} history
 */
function saveDutyHistory(history) {
  storageSet(STORAGE_KEYS.DUTY_HISTORY, history);
}

/**
 * 앱 최초 실행 시 기본 직원 데이터를 로드합니다.
 * @param {Array} defaultEmployees - employees.json 데이터
 */
function initializeAppData(defaultEmployees) {
  if (storageGet(STORAGE_KEYS.INITIALIZED, false)) return;
  if (getEmployees().length === 0 && Array.isArray(defaultEmployees)) {
    saveEmployees(defaultEmployees);
  }
  storageSet(STORAGE_KEYS.INITIALIZED, true);
}

/**
 * 슬롯으로 공개한 주 키 맵을 반환합니다.
 * @returns {Object} { "YYYY-Www": true }
 */
function getRevealedWeeks() {
  return storageGet(STORAGE_KEYS.REVEALED_WEEKS, {});
}

/**
 * 특정 주를 공개 완료로 표시합니다.
 * @param {string} weekKey
 */
function markWeekRevealed(weekKey) {
  if (!weekKey) return;
  const map = getRevealedWeeks();
  map[weekKey] = true;
  storageSet(STORAGE_KEYS.REVEALED_WEEKS, map);
}

/**
 * 해당 주가 이미 슬롯으로 공개됐는지 확인합니다.
 * @param {string} weekKey
 * @returns {boolean}
 */
function isWeekRevealed(weekKey) {
  if (!weekKey) return false;
  return !!getRevealedWeeks()[weekKey];
}

/**
 * 자동 배정된 월 목록을 반환합니다.
 * @returns {Object} { "YYYY-MM": true }
 */
function getAutoAssignedMonths() {
  return storageGet(STORAGE_KEYS.AUTO_ASSIGNED, {});
}

/**
 * 자동 배정 완료 월을 기록합니다.
 * @param {string} yearMonth
 */
function markAutoAssigned(yearMonth) {
  if (!yearMonth) return;
  const map = getAutoAssignedMonths();
  map[yearMonth] = true;
  storageSet(STORAGE_KEYS.AUTO_ASSIGNED, map);
}
