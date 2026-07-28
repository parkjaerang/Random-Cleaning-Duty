/**
 * 인증 연동 어댑터 + 공통 UI 헬퍼
 *
 * 자체 로그인은 없습니다.
 * 나중에 기존 사이트 로그인과 연결할 때 setExternalUser() 또는
 * window.RCD_AUTH / URL 파라미터로 사용자를 넘기면 됩니다.
 *
 * 연동 예시 (부모 사이트):
 *   window.RCD_AUTH = { role: 'user', name: '김민수', employeeId: 'emp-001' };
 *   // 또는 role: 'admin'
 *
 *   // 동적 갱신:
 *   setExternalUser({ role: 'user', name: '김민수' });
 */

/**
 * 외부(부모 사이트)에서 주입한 사용자 정보를 해석합니다.
 * 우선순위:
 * 1. window.RCD_AUTH
 * 2. URL ?name=홍길동&role=user|admin
 * 3. LocalStorage 임시 선택(개발용)
 * @returns {Object|null} 세션 객체
 */
function resolveExternalAuth() {
  // 1) 전역 주입
  if (window.RCD_AUTH && typeof window.RCD_AUTH === 'object') {
    return normalizeSession(window.RCD_AUTH);
  }

  // 2) URL 쿼리 (iframe 연동 시 편리)
  try {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name') || params.get('user');
    const role = params.get('role');
    if (name || role === 'admin') {
      return normalizeSession({
        role: role === 'admin' ? 'admin' : 'user',
        name: name || '관리자',
        employeeId: params.get('employeeId') || null
      });
    }
  } catch (err) {
    console.warn('URL auth parse failed', err);
  }

  // 3) 로컬 임시 선택 (개발·단독 실행용)
  return getSession();
}

/**
 * 외부/내부 사용자 객체를 앱 세션 형식으로 정규화합니다.
 * @param {Object} raw
 * @returns {Object}
 */
function normalizeSession(raw) {
  const role = raw.role === 'admin' ? 'admin' : 'user';
  const name = (raw.name || raw.username || '').trim();

  let employeeId = raw.employeeId || null;
  let department = raw.department || '';

  // 이름만 넘어온 경우 직원 명단에서 id 매칭
  if (role === 'user' && name && !employeeId && typeof getEmployees === 'function') {
    const emp = getEmployees().find((e) => e.name === name);
    if (emp) {
      employeeId = emp.id;
      department = emp.department;
    }
  }

  return {
    role,
    username: name || (role === 'admin' ? 'admin' : ''),
    name: name || (role === 'admin' ? '관리자' : ''),
    employeeId,
    department,
    source: raw.source || 'external',
    loginAt: raw.loginAt || new Date().toISOString()
  };
}

/**
 * 부모 사이트에서 호출해 현재 사용자를 설정합니다.
 * @param {Object|null} user - { role, name, employeeId? } / null이면 해제
 * @returns {Object|null}
 */
function setExternalUser(user) {
  if (!user) {
    clearSession();
    window.RCD_AUTH = null;
    return null;
  }
  const session = normalizeSession({ ...user, source: 'external' });
  window.RCD_AUTH = session;
  saveSession(session);
  return session;
}

/**
 * 개발용: 직원 명단에서 본인을 선택해 세션에 저장합니다.
 * (나중에 사이트 연동 후에는 사용하지 않아도 됩니다.)
 * @param {string} employeeId
 * @returns {Object|null}
 */
function selectLocalUser(employeeId) {
  const emp = typeof getEmployeeById === 'function' ? getEmployeeById(employeeId) : null;
  if (!emp) {
    clearSession();
    return null;
  }
  const session = normalizeSession({
    role: 'user',
    name: emp.name,
    employeeId: emp.id,
    department: emp.department,
    source: 'local-picker'
  });
  saveSession(session);
  return session;
}

/**
 * 현재 세션을 반환합니다. (외부 연동 우선)
 * @returns {Object|null}
 */
function getCurrentSession() {
  return resolveExternalAuth();
}

/**
 * 페이지용 세션을 준비합니다. 로그인 강제/리다이렉트 없음.
 * @param {'admin'|'user'|'any'} pageRole - 페이지 기본 역할 힌트
 * @returns {Object}
 */
function requireAuth(pageRole = 'any') {
  let session = resolveExternalAuth();

  // admin 페이지는 외부 권한이 없어도 관리자 모드로 동작
  // (실제 접근 제어는 부모 사이트에서 담당)
  if (pageRole === 'admin') {
    if (!session || session.role !== 'admin') {
      session = {
        role: 'admin',
        username: 'admin',
        name: session?.name || '관리자',
        employeeId: null,
        department: '',
        source: 'page-default',
        loginAt: new Date().toISOString()
      };
    }
    return session;
  }

  // 사용자 페이지: 세션이 없으면 게스트 (본인 선택 UI 표시)
  if (!session) {
    return {
      role: 'user',
      username: '',
      name: '',
      employeeId: null,
      department: '',
      source: 'guest',
      loginAt: new Date().toISOString()
    };
  }

  return session;
}

/**
 * 관리자인지 확인합니다.
 * @returns {boolean}
 */
function isAdmin() {
  const session = getCurrentSession();
  return !!(session && session.role === 'admin');
}

/**
 * 테마를 DOM에 적용합니다.
 * @param {string} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  saveTheme(theme);
}

/**
 * 다크모드 토글 버튼 바인딩
 */
function bindThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

/**
 * 언어 토글 버튼 바인딩
 */
function bindLanguageToggle() {
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      applyLanguage(lang);
    });
  });
}

/**
 * 언어를 적용하고 UI 텍스트를 갱신합니다.
 * @param {string} lang - 'ko' | 'zh'
 */
function applyLanguage(lang) {
  saveLanguage(lang);
  document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'ko');
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  if (typeof updateI18n === 'function') {
    updateI18n(lang);
  }
}

/**
 * Toast 메시지를 표시합니다.
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} type
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/**
 * 로딩 오버레이를 표시/숨김합니다.
 * @param {boolean} show
 * @param {string} text
 */
function setLoading(show, text = '') {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div><p class="loading-text"></p>';
    document.body.appendChild(overlay);
  }
  overlay.querySelector('.loading-text').textContent = text;
  overlay.classList.toggle('active', show);
}
