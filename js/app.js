/**
 * 앱 공통: i18n, 사용자/관리자 페이지 초기화
 */

/**
 * employees.json을 불러오거나, 실패 시 기본 샘플을 사용합니다.
 * @returns {Promise<Array>}
 */
function loadDefaultEmployees() {
  return fetch('data/employees.json')
    .then((r) => {
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    })
    .catch(() => [
      { id: 'emp-001', name: '김민수', department: '경영지원' },
      { id: 'emp-002', name: '이서연', department: '경영지원' },
      { id: 'emp-003', name: '박준혁', department: '영업1팀' },
      { id: 'emp-004', name: '최유진', department: '영업1팀' },
      { id: 'emp-005', name: '정하늘', department: '영업2팀' },
      { id: 'emp-006', name: '한지우', department: '영업2팀' },
      { id: 'emp-007', name: '오세훈', department: '개발팀' },
      { id: 'emp-008', name: '윤서아', department: '개발팀' },
      { id: 'emp-009', name: '장도윤', department: '개발팀' },
      { id: 'emp-010', name: '강예린', department: '디자인팀' },
      { id: 'emp-011', name: '조현우', department: '디자인팀' },
      { id: 'emp-012', name: '배수진', department: '마케팅' },
      { id: 'emp-013', name: '신동혁', department: '마케팅' },
      { id: 'emp-014', name: '임나영', department: '인사팀' },
      { id: 'emp-015', name: '황민재', department: '인사팀' },
      { id: 'emp-016', name: '송지호', department: '재무팀' },
      { id: 'emp-017', name: '권소희', department: '재무팀' },
      { id: 'emp-018', name: '노태영', department: '물류팀' },
      { id: 'emp-019', name: '문채원', department: '물류팀' },
      { id: 'emp-020', name: '류건우', department: '고객지원' }
    ]);
}

/** 다국어 사전 */
const I18N = {
  ko: {
    'nav.swaps': '교환 요청',
    'nav.admin': '관리자',
    'nav.userHome': '일정 보기',
    'nav.whoami': '본인',
    'nav.pickUser': '선택하세요',
    'home.sub': '하루에 2명, 일요일·공휴일 제외. 담당 횟수와 주방·화장실 담당 순서를 균등하게 자동 배정합니다.',
    'rule.day.title': '하루 / 2명',
    'rule.day.desc': '주방담당·화장실 담당 각각 1명, 분리수거는 함께.',
    'rule.even.title': '균등 배정',
    'rule.even.desc': '격월로 횟수를 번갈아 맞춰 전원 균등하게 배정합니다.',
    'rule.seq.title': '순서 교대',
    'rule.seq.desc': '사람마다 주방담당/화장실 담당 순서를 번갈아 담당합니다.',
    'roles.title': '당번 역할',
    'roles.front': '왼쪽 주방담당 — 음식물 쓰레기통 청소, 정수기 주변 닦기',
    'roles.back': '오른쪽 화장실 담당 — 변기 시트 클리너·휴지 확인·보충',
    'roles.note': '당일 청소가 어렵다면 미리 다른 분과 상의하여 날짜를 변경해 주세요.',
    'view.week': '주간',
    'view.mine': '내 일정',
    'empty.schedule': '아직 표시할 일정이 없습니다.',
    'empty.hint': '레버를 당겨 이번 주 당번을 확인하세요.',
    'empty.adminSchedule': '일정을 생성하면 명단이 표시됩니다.',
    'empty.employees': '등록된 직원이 없습니다.',
    'empty.swaps': '교환 요청이 없습니다.',
    'empty.pullSlot': '레버를 당겨 이번 주 당첨자를 확인하세요.',
    'empty.noMonthRoster': '직원 페이지에서는 한 달 전체 명단을 미리 보지 않습니다.',
    'auto.assign.done': '다음 달 청소 담당이 자동 배정되었습니다.',
    'auto.assign.current': '이번 달 청소 담당이 자동 배정되었습니다.',
    'swap.title': '교환 요청',
    'swap.selectMine': '내 일정을 선택하세요.',
    'swap.selectTarget': '교환할 상대 일정을 선택하세요.',
    'swap.weekOnly': '이번 주 담당 명단에 있는 사람끼리만 교환할 수 있습니다.',
    'swap.weekEmpty': '이번 주 교환 가능한 일정이 없습니다.',
    'swap.history': '요청 내역',
    'swap.request': '교환 요청',
    'swap.approve': '승인',
    'swap.reject': '거절',
    'swap.pendingAlert': '교환요청 {count}건이 있습니다.',
    'swap.status.Pending': '대기중',
    'swap.status.Approved': '승인됨',
    'swap.status.Rejected': '거절됨',
    'swap.status.Expired': '만료됨',
    'table.date': '날짜',
    'table.front': '주방담당',
    'table.back': '화장실 담당',
    'table.note': '비고',
    'admin.tab.employees': '직원 관리',
    'admin.tab.schedule': '일정 관리',
    'admin.tab.swaps': '교환 관리',
    'admin.emp.title': '직원명단 관리',
    'admin.emp.manage': '직원 관리',
    'admin.emp.manageDesc': '입사자 추가, 퇴사자 삭제',
    'admin.emp.excel': '직원 명단 엑셀 불러오기',
    'admin.emp.excelDesc': '많은 인원의 직원 명단을 엑셀에서 가져오기',
    'admin.emp.add': '직원 추가',
    'admin.emp.addBtn': '추가',
    'admin.emp.deptPh': '팀/파트',
    'admin.emp.namePh': '이름',
    'admin.emp.searchPh': '이름·부서 검색',
    'admin.emp.allDept': '부서/팀별',
    'admin.emp.import': '직원 명단 가져오기',
    'admin.emp.clearAll': '전체 명단 삭제',
    'admin.emp.clearConfirm': '전체 직원 명단을 삭제할까요? 이 작업은 되돌릴 수 없습니다.',
    'admin.emp.clearEmpty': '삭제할 직원이 없습니다.',
    'admin.emp.drop': '엑셀 파일을 여기에 드래그하거나 클릭하여 업로드',
    'admin.emp.dropHint': '형식: 이름, 부서',
    'admin.emp.edit': '직원 수정',
    'admin.emp.delete': '삭제',
    'admin.emp.save': '저장',
    'admin.sch.title': '일정 관리',
    'admin.sch.sub': '이번 달 일정을 생성하고 당번표를 수정할 수 있습니다.',
    'admin.sch.generate': '이번 달 일정 생성',
    'admin.sch.download': '한글파일 다운로드',
    'admin.swap.title': '교환 요청 관리',
    'greeting': '{name}님',
    'greeting.guest': '일정을 보려면 본인을 선택하세요.',
    'myDuty': '나의 당번',
    'role.front': '주방담당',
    'role.back': '화장실 담당',
    'week.reveal.title': '이번 주 당번 추첨중...',
    'week.reveal.done': '🎉 이번 주 명단 공개',
    'week.reveal.heading': '이번 주 담당 명단',
    'week.reveal.empty': '표시할 이번 주 일정이 없습니다.',
    'week.reveal.hint': '슬롯에서 하루씩 확정되면 아래에 추가됩니다.'
  },
  zh: {
    'nav.swaps': '换班申请',
    'nav.admin': '管理',
    'nav.userHome': '查看日程',
    'nav.whoami': '本人',
    'nav.pickUser': '请选择',
    'home.sub': '每天2人，排除周日和节假日。自动均衡分配次数与厨房·卫生间职责顺序。',
    'rule.day.title': '每天 / 2人',
    'rule.day.desc': '厨房负责人·卫生间负责人各1人，分类回收一起完成。',
    'rule.even.title': '均衡分配',
    'rule.even.desc': '隔月轮换次数，保证全员分配公平。',
    'rule.seq.title': '顺序轮换',
    'rule.seq.desc': '每人厨房负责人/卫生间负责人顺序轮流担当。',
    'roles.title': '值班角色',
    'roles.front': '左侧 厨房负责人 — 清理食物垃圾桶，擦拭净水器周围',
    'roles.back': '右侧 卫生间负责人 — 检查马桶清洁剂与卫生纸并补充',
    'roles.note': '当天无法清洁时，请提前与他人协商更换日期。',
    'view.week': '周视图',
    'view.mine': '我的日程',
    'empty.schedule': '暂无日程。',
    'empty.hint': '拉动拉杆查看本周值班。',
    'empty.adminSchedule': '生成日程后将显示名单。',
    'empty.employees': '暂无员工。',
    'empty.swaps': '暂无换班申请。',
    'empty.pullSlot': '拉动拉杆查看本周中奖名单。',
    'empty.noMonthRoster': '员工页面不预先显示整月名单。',
    'auto.assign.done': '下月清洁值班已自动分配。',
    'auto.assign.current': '本月清洁值班已自动分配。',
    'swap.title': '换班申请',
    'swap.selectMine': '请选择我的日程。',
    'swap.selectTarget': '请选择要交换的对方日程。',
    'swap.weekOnly': '只能与本周值班名单内的人员交换。',
    'swap.weekEmpty': '本周没有可交换的日程。',
    'swap.history': '申请记录',
    'swap.request': '申请换班',
    'swap.approve': '同意',
    'swap.reject': '拒绝',
    'swap.pendingAlert': '有 {count} 件换班申请。',
    'swap.status.Pending': '待处理',
    'swap.status.Approved': '已同意',
    'swap.status.Rejected': '已拒绝',
    'swap.status.Expired': '已过期',
    'table.date': '日期',
    'table.front': '厨房负责人',
    'table.back': '卫生间负责人',
    'table.note': '备注',
    'admin.tab.employees': '员工管理',
    'admin.tab.schedule': '日程管理',
    'admin.tab.swaps': '换班管理',
    'admin.emp.title': '员工名单管理',
    'admin.emp.manage': '员工管理',
    'admin.emp.manageDesc': '添加入职、删除离职',
    'admin.emp.excel': '从Excel导入员工名单',
    'admin.emp.excelDesc': '从Excel批量导入员工',
    'admin.emp.add': '添加员工',
    'admin.emp.addBtn': '添加',
    'admin.emp.deptPh': '团队/部门',
    'admin.emp.namePh': '姓名',
    'admin.emp.searchPh': '搜索姓名·部门',
    'admin.emp.allDept': '按部门/团队',
    'admin.emp.import': '导入员工名单',
    'admin.emp.clearAll': '清空全部名单',
    'admin.emp.clearConfirm': '确定清空全部员工名单吗？此操作无法撤销。',
    'admin.emp.clearEmpty': '没有可删除的员工。',
    'admin.emp.drop': '将Excel拖到此处或点击上传',
    'admin.emp.dropHint': '格式: 姓名, 部门',
    'admin.emp.edit': '编辑员工',
    'admin.emp.delete': '删除',
    'admin.emp.save': '保存',
    'admin.sch.title': '日程管理',
    'admin.sch.sub': '可生成本月日程并修改值班表。',
    'admin.sch.generate': '生成本月日程',
    'admin.sch.download': '下载表格文件',
    'admin.swap.title': '换班申请管理',
    'greeting': '{name}',
    'greeting.guest': '请选择本人以查看日程。',
    'myDuty': '我的值班',
    'role.front': '厨房负责人',
    'role.back': '卫生间负责人',
    'week.reveal.title': '本周值班抽取中...',
    'week.reveal.done': '🎉 本周名单公开',
    'week.reveal.heading': '本周值班名单',
    'week.reveal.empty': '暂无本周日程。',
    'week.reveal.hint': '老虎机每天确定后会逐条添加到下方。'
  }
};

/**
 * i18n 키에 해당하는 문자열을 반환합니다.
 * @param {string} key
 * @param {Object} [vars]
 * @returns {string}
 */
function t(key, vars) {
  const lang = getLanguage();
  let text = (I18N[lang] && I18N[lang][key]) || (I18N.ko[key] || key);
  if (vars) {
    Object.keys(vars).forEach((k) => {
      text = text.replace(`{${k}}`, vars[k]);
    });
  }
  return text;
}

/**
 * data-i18n 속성을 가진 요소들의 텍스트를 갱신합니다.
 * @param {string} [lang]
 */
function updateI18n(lang) {
  const L = lang || getLanguage();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (I18N[L] && I18N[L][key]) el.textContent = I18N[L][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (I18N[L] && I18N[L][key]) el.setAttribute('placeholder', I18N[L][key]);
  });

  // 동적 영역 재렌더
  const page = document.body?.dataset?.page;
  if (page === 'index' && AppState.session) {
    updateUserGreeting();
    populateUserPicker();
    renderUserSchedule();
  }
  if (page === 'admin' && AppState.session) {
    const active = document.querySelector('.tab-btn.active');
    if (active) switchAdminTab(active.dataset.tab);
  }
}

/** 현재 보고 있는 연/월 상태 */
const AppState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  view: 'week',
  session: null,
  swapFromDayId: null,
  swapRole: null,
  revealing: false
};

/**
 * 모달을 엽니다.
 * @param {string} id
 */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

/**
 * 모달을 닫습니다.
 * @param {string} id
 */
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

/**
 * 공통 모달/테마/언어 바인딩
 */
function bindCommonUI() {
  applyTheme(getTheme());
  applyLanguage(getLanguage());
  bindThemeToggle();
  bindLanguageToggle();

  document.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', () => closeModal(el.getAttribute('data-close')));
  });
}

/**
 * 인사말 영역을 갱신합니다.
 */
function updateUserGreeting() {
  const greet = document.getElementById('user-greeting');
  if (!greet) return;
  const session = AppState.session;
  if (session && session.name) {
    greet.textContent = t('greeting', { name: session.name });
  } else {
    greet.textContent = t('greeting.guest');
  }
}

/**
 * 본인 선택 드롭다운을 채웁니다. (외부 로그인 연동 전 임시용)
 * 외부에서 RCD_AUTH가 주입되면 숨깁니다.
 */
function populateUserPicker() {
  const picker = document.getElementById('user-picker');
  const wrap = document.querySelector('.user-picker-wrap');
  if (!picker) return;

  // 외부 사이트에서 이미 사용자를 주입한 경우 선택 UI 숨김
  const external = window.RCD_AUTH && window.RCD_AUTH.name;
  if (external && wrap) {
    wrap.hidden = true;
    return;
  }
  if (wrap) wrap.hidden = false;

  const employees = sortEmployeesByDepartment(getEmployees());
  const currentId = AppState.session?.employeeId || '';
  picker.innerHTML =
    `<option value="">${t('nav.pickUser')}</option>` +
    employees
      .map(
        (e) =>
          `<option value="${e.id}" ${e.id === currentId ? 'selected' : ''}>${e.department} ${e.name}</option>`
      )
      .join('');
}

/**
 * 일정 테이블 HTML을 생성합니다.
 * @param {Array} schedule
 * @param {Object} options
 * @returns {string}
 */
function buildScheduleTableHTML(schedule, options = {}) {
  const { editable = false, highlightId = null } = options;
  const employees = getEmployees();
  const lang = getLanguage();

  if (!schedule.length) {
    return `<div class="empty-state"><p>${t('empty.schedule')}</p></div>`;
  }

  const rows = schedule
    .map((d) => {
      const highlight =
        highlightId && (d.frontId === highlightId || d.backId === highlightId)
          ? 'is-mine'
          : '';

      if (editable) {
        return `
          <tr class="${highlight}" data-day-id="${d.id}">
            <td>${d.date} (${getDayLabel(d.dayOfWeek, lang)})</td>
            <td>
              <select class="inline-select" data-field="front" data-day="${d.id}">
                ${employees
                  .map(
                    (e) =>
                      `<option value="${e.id}" ${e.id === d.frontId ? 'selected' : ''}>${e.department} ${e.name}</option>`
                  )
                  .join('')}
              </select>
            </td>
            <td>
              <select class="inline-select" data-field="back" data-day="${d.id}">
                ${employees
                  .map(
                    (e) =>
                      `<option value="${e.id}" ${e.id === d.backId ? 'selected' : ''}>${e.department} ${e.name}</option>`
                  )
                  .join('')}
              </select>
            </td>
            <td>
              <input class="inline-note" data-field="note" data-day="${d.id}" value="${escapeAttr(d.note || '')}" />
            </td>
          </tr>`;
      }

      return `
        <tr class="${highlight}">
          <td>${d.date} (${getDayLabel(d.dayOfWeek, lang)})</td>
          <td>${d.frontDept || ''} ${d.frontName}</td>
          <td>${d.backDept || ''} ${d.backName}</td>
          <td>${d.note || ''}</td>
        </tr>`;
    })
    .join('');

  return `
    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>${t('table.date')}</th>
            <th>${t('table.front')}</th>
            <th>${t('table.back')}</th>
            <th>${t('table.note')}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/**
 * HTML attribute escape
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * 부서 | 이름 필 HTML
 * @param {string} dept
 * @param {string} name
 * @returns {string}
 */
function personPillHTML(dept, name) {
  const d = (dept || '').trim();
  const n = (name || '').trim();
  if (!d) return `<span class="pill"><span class="pill-name">${n}</span></span>`;
  return `<span class="pill"><span class="pill-dept">${d}</span><span class="pill-sep" aria-hidden="true"></span><span class="pill-name">${n}</span></span>`;
}

/**
 * 내 일정 카드 HTML
 * @param {Array} days
 * @param {string} employeeId
 * @param {Set<string>} [swapableDayIds] - 교환 버튼을 보여줄 일정 ID (이번 주)
 * @returns {string}
 */
function buildMyCardsHTML(days, employeeId, swapableDayIds = null) {
  const lang = getLanguage();
  if (!days.length) {
    return `<div class="empty-state"><p>${t('empty.schedule')}</p></div>`;
  }

  return `
    <div class="duty-cards">
      ${days
        .map((d) => {
          const role = getMyRoleOnDay(d, employeeId);
          const roleLabel = role === 'front' ? t('role.front') : t('role.back');
          const partnerDept = role === 'front' ? d.backDept : d.frontDept;
          const partnerName = role === 'front' ? d.backName : d.frontName;
          const partner = [partnerDept, partnerName].filter(Boolean).join(' | ');
          const canSwap = !swapableDayIds || swapableDayIds.has(d.id);
          return `
            <article class="duty-card">
              <div class="duty-card-date">${d.date} (${getDayLabel(d.dayOfWeek, lang)})</div>
              <div class="duty-card-role">${roleLabel}</div>
              <div class="duty-card-partner">with ${partner}</div>
              ${
                canSwap
                  ? `<button type="button" class="btn btn-sm btn-secondary btn-swap-day" data-day-id="${d.id}" data-role="${role}">
                ${t('swap.request')}
              </button>`
                  : ''
              }
            </article>`;
        })
        .join('')}
    </div>`;
}

/**
 * 결과 패널에 명단 그리드(카드) 형태로 일정을 렌더링합니다.
 * @param {HTMLElement} container
 * @param {Array} schedule
 * @param {Object} [options]
 * @param {string} [options.title]
 */
function renderScheduleGrid(container, schedule, options = {}) {
  if (!schedule.length) {
    container.innerHTML = `<div class="empty-state"><p>${t('empty.schedule')}</p></div>`;
    return;
  }

  const lang = getLanguage();
  const title =
    options.title ||
    `${AppState.year}-${String(AppState.month).padStart(2, '0')}`;
  container.innerHTML = `
    <div class="result-header">
      <h2>${title}</h2>
    </div>
    <div class="result-grid">
      ${schedule
        .map(
          (d) => `
        <article class="result-card">
          <div class="result-date">${d.date} (${getDayLabel(d.dayOfWeek, lang)})</div>
          <div class="result-pair">
            ${personPillHTML(d.frontDept, d.frontName)}
            ${personPillHTML(d.backDept, d.backName)}
          </div>
        </article>`
        )
        .join('')}
    </div>`;
}

/**
 * 하루 확정 카드를 HTML로 만듭니다.
 * @param {Object} day
 * @param {string} [lang]
 * @returns {string}
 */
function buildRevealDayCardHTML(day, lang = getLanguage()) {
  return `
    <article class="result-card reveal-day-card" data-day-id="${day.id}">
      <div class="result-date">${day.date} (${getDayLabel(day.dayOfWeek, lang)})</div>
      <div class="result-pair">
        ${personPillHTML(day.frontDept, day.frontName)}
        ${personPillHTML(day.backDept, day.backName)}
      </div>
    </article>`;
}

/**
 * 공개 리스트 컨테이너를 준비합니다.
 * @param {HTMLElement} listEl
 * @param {string} [title]
 */
function prepareRevealList(listEl, title) {
  if (!listEl) return;
  listEl.hidden = false;
  listEl.innerHTML = `
    <div class="result-header">
      <h2>${title || t('week.reveal.heading')}</h2>
      <p class="muted reveal-list-hint">${t('week.reveal.hint')}</p>
    </div>
    <div class="result-grid reveal-day-list" id="reveal-day-list"></div>`;
}

/**
 * 공개 리스트에 하루를 추가합니다.
 * @param {Object} day
 */
function appendRevealDay(day) {
  const list = document.getElementById('reveal-day-list');
  if (!list) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = buildRevealDayCardHTML(day);
  const card = wrap.firstElementChild;
  if (card) {
    list.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * 현재 보고 있는 월 기준 이번 주 키를 반환합니다.
 * @returns {{ yearMonth: string, weekSchedule: Array, weekKey: string|null }}
 */
function getCurrentWeekContext() {
  const yearMonth = toYearMonth(AppState.year, AppState.month);
  const weekSchedule = getWeekSchedule(yearMonth);
  const weekKey = weekSchedule.length
    ? getWeekKey(new Date(weekSchedule[0].date + 'T00:00:00'))
    : null;
  return { yearMonth, weekSchedule, weekKey };
}

/**
 * 직원 페이지: 슬롯을 당겨 이번 주 담당 명단을 하루씩 공개합니다.
 */
async function revealUserWeekRoster() {
  const { weekSchedule, weekKey } = getCurrentWeekContext();
  const panel = document.getElementById('animation-overlay');
  const empty = document.getElementById('empty-state');
  const prompt = document.getElementById('slot-pull-prompt');
  const view = document.getElementById('schedule-view');
  const lang = getLanguage();

  if (!panel) return;

  if (!weekSchedule.length) {
    panel.classList.add('has-content');
    panel.innerHTML = `<div class="empty-state"><p>${t('week.reveal.empty')}</p></div>`;
    showToast(t('week.reveal.empty'), 'warning');
    return;
  }

  AppState.revealing = true;
  AppState.view = 'week';
  document.querySelectorAll('[data-view]').forEach((b) =>
    b.classList.toggle('active', b.dataset.view === 'week')
  );

  if (empty) empty.hidden = true;
  if (prompt) prompt.hidden = true;
  prepareRevealList(view, t('week.reveal.heading'));

  const employees = getEmployees();
  const slot = document.getElementById('mini-slot');
  panel.classList.add('has-content');
  panel.innerHTML = '';
  document
    .querySelectorAll('.left-slot-zone [data-slot-layer], .left-slot-zone [data-slot-footer]')
    .forEach((el) => el.remove());

  await playSlotMachineAnimation({
    panel,
    existingSlot: slot,
    schedule: weekSchedule,
    namePool: employees.map((e) => e.name),
    lang,
    title: t('week.reveal.title'),
    doneText: t('week.reveal.done'),
    keepSlotVisible: true,
    detailedCount: weekSchedule.length,
    onDayComplete: (day) => {
      appendRevealDay(day);
    },
    onComplete: () => {
      if (weekKey) markWeekRevealed(weekKey);
      AppState.revealing = false;
      const hint = view?.querySelector('.reveal-list-hint');
      if (hint) hint.remove();
    }
  });
}

/**
 * 이미 공개된 이번 주 명단을 리스트로 표시합니다.
 * @param {HTMLElement} view
 * @param {Array} weekSchedule
 */
function renderRevealedWeekList(view, weekSchedule) {
  if (!view) return;
  const lang = getLanguage();
  view.hidden = false;
  view.innerHTML = `
    <div class="result-header">
      <h2>${t('week.reveal.heading')}</h2>
    </div>
    <div class="result-grid reveal-day-list" id="reveal-day-list">
      ${weekSchedule.map((d) => buildRevealDayCardHTML(d, lang)).join('')}
    </div>`;
}

/**
 * 사용자(index) 페이지 일정 영역을 갱신합니다.
 * 직원 페이지에서는 한 달 전체 명단을 숨기고, 슬롯으로 공개된 이번 주만 보여줍니다.
 */
function renderUserSchedule() {
  const yearMonth = toYearMonth(AppState.year, AppState.month);
  const schedule = getScheduleByMonth(yearMonth);
  const panel = document.getElementById('result-panel');
  const empty = document.getElementById('empty-state');
  const prompt = document.getElementById('slot-pull-prompt');
  const view = document.getElementById('schedule-view');
  const monthLabel = document.getElementById('current-month');
  const overlay = document.getElementById('animation-overlay');

  if (monthLabel) {
    monthLabel.textContent = `${AppState.year}.${String(AppState.month).padStart(2, '0')}`;
  }

  if (!panel || !view) return;

  // 슬롯 추첨 중이면 리스트를 덮어쓰지 않음
  if (AppState.revealing) return;

  const session = AppState.session;
  const empId = session && session.employeeId;
  const setPullPrompt = (visible) => {
    if (!prompt) return;
    prompt.hidden = !visible;
    if (visible) prompt.textContent = t('empty.pullSlot');
  };

  if (AppState.view === 'mine') {
    setPullPrompt(false);
    if (overlay) {
      overlay.innerHTML = '';
      overlay.classList.remove('has-content');
    }
    if (!schedule.length || !empId) {
      if (empty) {
        empty.hidden = false;
        empty.innerHTML = `
          <p data-i18n="empty.schedule">${t('empty.schedule')}</p>
          <p class="muted">${empId ? t('empty.hint') : t('greeting.guest')}</p>`;
      }
      view.hidden = true;
      view.innerHTML = '';
      return;
    }
    if (empty) empty.hidden = true;
    view.hidden = false;
    const mine = getMySchedule(yearMonth, empId);
    const weekSchedule = getWeekSchedule(yearMonth);
    const weekDayIds = new Set(weekSchedule.map((d) => d.id));
    view.innerHTML = `
      <h2 class="result-title">${t('myDuty')}</h2>
      ${buildMyCardsHTML(mine, empId, weekDayIds)}`;
    view.querySelectorAll('.btn-swap-day').forEach((btn) => {
      btn.addEventListener('click', () => {
        openSwapFlow(btn.dataset.dayId, btn.dataset.role);
      });
    });
    return;
  }

  // week: 슬롯으로 공개된 이번 주만 표시
  if (!schedule.length) {
    setPullPrompt(false);
    if (overlay) {
      overlay.innerHTML = '';
      overlay.classList.remove('has-content');
    }
    if (empty) {
      empty.hidden = false;
      empty.innerHTML = `
        <p>${t('empty.schedule')}</p>
        <p class="muted">${t('empty.hint')}</p>`;
    }
    view.hidden = true;
    view.innerHTML = '';
    return;
  }

  const { weekSchedule, weekKey } = getCurrentWeekContext();

  if (weekKey && isWeekRevealed(weekKey) && weekSchedule.length) {
    setPullPrompt(false);
    if (empty) empty.hidden = true;
    if (overlay && !overlay.querySelector('[data-slot-layer]')) {
      overlay.innerHTML = '';
      overlay.classList.remove('has-content');
    }
    renderRevealedWeekList(view, weekSchedule);
    return;
  }

  setPullPrompt(true);
  if (empty) {
    empty.hidden = false;
    empty.innerHTML = `<p class="muted">${t('week.reveal.hint')}</p>`;
  }
  view.hidden = true;
  view.innerHTML = '';
  if (overlay && !overlay.querySelector('[data-slot-layer]')) {
    overlay.innerHTML = '';
    overlay.classList.remove('has-content');
  }
}

/**
 * YYYY-MM-DD를 "날짜 (요일)"로 표시합니다.
 * @param {string} dateStr
 * @returns {string}
 */
function formatSwapDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${dateStr} (${getDayLabel(d.getDay(), getLanguage())})`;
}

/**
 * 교환 요청 본문 HTML (누가 어느 날로 바뀌는지)
 * @param {Object} r
 * @returns {string}
 */
function renderSwapRequestSummary(r) {
  const roleLabel = r.role === 'front' ? t('role.front') : t('role.back');
  const statusLabel = t(`swap.status.${r.status}`) || r.status;
  const fromLabel = formatSwapDateLabel(r.fromDate);
  const toLabel = formatSwapDateLabel(r.toDate);
  return `
    <div class="swap-request-body">
      <div class="swap-meta">
        <span class="swap-role-tag">${roleLabel}</span>
        <span class="status-chip">${statusLabel}</span>
      </div>
      <div class="swap-legs">
        <p class="swap-leg"><strong>${r.requesterName}</strong>: ${fromLabel} → ${toLabel}</p>
        <p class="swap-leg"><strong>${r.targetName}</strong>: ${toLabel} → ${fromLabel}</p>
      </div>
      ${r.rejectReason ? `<p class="error-text">${r.rejectReason}</p>` : ''}
    </div>`;
}

/**
 * 교환 플로우를 특정 일정부터 엽니다.
 * @param {string} dayId
 * @param {string} role
 */
function openSwapFlow(dayId, role) {
  AppState.swapFromDayId = dayId;
  AppState.swapRole = role;
  openModal('swap-modal');
  renderSwapModal();
}

/**
 * 교환 모달 내용을 렌더링합니다.
 */
function renderSwapModal() {
  const session = AppState.session;
  if (!session || !session.employeeId) return;

  const yearMonth = toYearMonth(AppState.year, AppState.month);
  const myDaysEl = document.getElementById('swap-my-days');
  const targetsEl = document.getElementById('swap-targets');
  const stepSelect = document.getElementById('swap-step-select');
  const stepTarget = document.getElementById('swap-step-target');
  const historyEl = document.getElementById('swap-history-list');

  const weekSchedule = getWeekSchedule(yearMonth);
  const weekDayIds = new Set(weekSchedule.map((d) => d.id));
  const mine = getMySchedule(yearMonth, session.employeeId).filter((d) =>
    weekDayIds.has(d.id)
  );
  const lang = getLanguage();

  if (myDaysEl) {
    myDaysEl.innerHTML = mine.length
      ? mine
          .map((d) => {
            const role = getMyRoleOnDay(d, session.employeeId);
            return `<button type="button" class="swap-item ${AppState.swapFromDayId === d.id ? 'active' : ''}" data-day-id="${d.id}" data-role="${role}">
              ${d.date} (${getDayLabel(d.dayOfWeek, lang)}) · ${role === 'front' ? t('role.front') : t('role.back')}
            </button>`;
          })
          .join('')
      : `<p class="muted">${t('swap.weekEmpty')}</p>`;

    myDaysEl.querySelectorAll('.swap-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        AppState.swapFromDayId = btn.dataset.dayId;
        AppState.swapRole = btn.dataset.role;
        renderSwapModal();
      });
    });
  }

  if (AppState.swapFromDayId && stepTarget && targetsEl) {
    stepTarget.hidden = false;
    const targets = getSwappableDays(
      yearMonth,
      AppState.swapFromDayId,
      session.employeeId
    );
    targetsEl.innerHTML = targets.length
      ? targets
          .map(
            (item) => `
          <button type="button" class="swap-item" data-to-day="${item.day.id}" data-target-id="${item.otherId}" data-target-name="${escapeAttr(item.otherName)}">
            ${item.day.date} · ${item.otherName}
          </button>`
          )
          .join('')
      : `<p class="muted">${t('swap.weekEmpty')}</p>`;

    targetsEl.querySelectorAll('.swap-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const result = createSwapRequest({
          yearMonth,
          fromDayId: AppState.swapFromDayId,
          toDayId: btn.dataset.toDay,
          requesterId: session.employeeId,
          requesterName: session.name,
          targetId: btn.dataset.targetId,
          targetName: btn.dataset.targetName,
          role: AppState.swapRole
        });
        showToast(result.message, result.ok ? 'success' : 'error');
        if (result.ok) {
          AppState.swapFromDayId = null;
          updateSwapBadge();
          renderSwapModal();
        }
      });
    });
  } else if (stepTarget) {
    stepTarget.hidden = true;
  }

  // 요청 내역 + 나에게 온 요청 승인
  if (historyEl) {
    const requests = getMySwapRequests(session.employeeId);
    historyEl.innerHTML = requests.length
      ? requests
          .map((r) => {
            const canAct =
              r.status === 'Pending' && r.targetId === session.employeeId;
            return `
              <div class="swap-history-item status-${r.status}">
                ${renderSwapRequestSummary(r)}
                ${
                  canAct
                    ? `<div class="row-actions">
                        <button type="button" class="btn btn-sm btn-primary" data-approve="${r.id}">${t('swap.approve')}</button>
                        <button type="button" class="btn btn-sm btn-danger" data-reject="${r.id}">${t('swap.reject')}</button>
                      </div>`
                    : ''
                }
              </div>`;
          })
          .join('')
      : `<p class="muted">${t('empty.swaps')}</p>`;

    historyEl.querySelectorAll('[data-approve]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const res = approveSwapRequest(btn.dataset.approve);
        showToast(res.message, res.ok ? 'success' : 'error');
        updateSwapBadge();
        renderUserSchedule();
        renderSwapModal();
      });
    });
    historyEl.querySelectorAll('[data-reject]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const res = rejectSwapRequest(btn.dataset.reject);
        showToast(res.message, res.ok ? 'success' : 'error');
        updateSwapBadge();
        renderSwapModal();
      });
    });
  }
}

/**
 * 교환 알림 배지를 갱신합니다.
 */
function updateSwapBadge() {
  const session = AppState.session;
  const badge = document.getElementById('swap-badge');
  if (!badge || !session || !session.employeeId) {
    if (badge) badge.hidden = true;
    return;
  }

  const count = getPendingSwapCount(session.employeeId);
  badge.hidden = count === 0;
  badge.textContent = String(count);
}

/**
 * 나에게 온 교환요청이 있으면 상단 알림을 잠깐 표시합니다.
 * @param {string} employeeId
 */
function notifyPendingSwaps(employeeId) {
  if (!employeeId) return;
  const count = getPendingSwapCount(employeeId);
  if (count <= 0) return;

  document.getElementById('swap-pending-alert')?.remove();

  const banner = document.createElement('div');
  banner.id = 'swap-pending-alert';
  banner.className = 'swap-top-alert';
  banner.setAttribute('role', 'status');
  banner.textContent = t('swap.pendingAlert', { count });

  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('show'));

  setTimeout(() => {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 300);
  }, 3200);
}

/**
 * index.html 초기화
 */
function initIndexPage() {
  const session = requireAuth('user');
  AppState.session = session;
  bindCommonUI();

  loadDefaultEmployees()
    .then((data) => initializeAppData(data))
    .finally(() => {
      // 직원 로드 후 이름→id 재매칭
      AppState.session = requireAuth('user');

      // 매월 말일 자동 배정 (+ 놓친 경우 현재 달 백필)
      try {
        const auto = ensureAutoMonthlyAssignment();
        if (auto.generated.length) {
          const nextYm = getNextYearMonth(
            toYearMonth(new Date().getFullYear(), new Date().getMonth() + 1)
          );
          const msg = auto.generated.includes(nextYm) && isLastDayOfMonth()
            ? t('auto.assign.done')
            : t('auto.assign.current');
          showToast(msg, 'success');
        }
      } catch (err) {
        console.error('auto assign failed', err);
      }

      populateUserPicker();
      updateUserGreeting();

      document.getElementById('user-picker')?.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) {
          clearSession();
          AppState.session = requireAuth('user');
        } else {
          AppState.session = selectLocalUser(id);
          notifyPendingSwaps(id);
        }
        updateUserGreeting();
        updateSwapBadge();
        renderUserSchedule();
      });

      document.getElementById('prev-month')?.addEventListener('click', () => {
        shiftMonth(-1);
        renderUserSchedule();
      });
      document.getElementById('next-month')?.addEventListener('click', () => {
        shiftMonth(1);
        renderUserSchedule();
      });

      document.querySelectorAll('[data-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
          AppState.view = btn.dataset.view;
          document.querySelectorAll('[data-view]').forEach((b) =>
            b.classList.toggle('active', b === btn)
          );
          renderUserSchedule();
        });
      });

      document.getElementById('nav-swaps')?.addEventListener('click', () => {
        if (!AppState.session?.employeeId) {
          showToast(t('greeting.guest'), 'warning');
          return;
        }
        AppState.swapFromDayId = null;
        openModal('swap-modal');
        renderSwapModal();
      });

      bindMiniSlotLever(document.getElementById('mini-slot'), {
        onPull: revealUserWeekRoster
      });
      updateSwapBadge();
      renderUserSchedule();
    });
}

/**
 * 월을 delta만큼 이동합니다.
 * @param {number} delta
 */
function shiftMonth(delta) {
  let m = AppState.month + delta;
  let y = AppState.year;
  if (m < 1) {
    m = 12;
    y--;
  }
  if (m > 12) {
    m = 1;
    y++;
  }
  AppState.month = m;
  AppState.year = y;
}

/* =========================
 * Admin page
 * ========================= */

/**
 * 관리자 탭 전환
 * @param {string} tab
 */
function switchAdminTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  ['employees', 'schedule', 'swaps'].forEach((id) => {
    const el = document.getElementById(`tab-${id}`);
    if (el) el.hidden = id !== tab;
  });

  if (tab === 'employees') renderEmployeeGrid();
  if (tab === 'schedule') renderAdminSchedule();
  if (tab === 'swaps') renderAdminSwaps();
}

/**
 * 직원 그리드를 렌더링합니다.
 */
function renderEmployeeGrid() {
  const grid = document.getElementById('employee-grid');
  if (!grid) return;

  const query = document.getElementById('emp-search')?.value || '';
  const dept = document.getElementById('emp-dept-filter')?.value || '';
  const list = searchEmployees(query, dept);

  // 부서 필터 옵션 갱신
  const select = document.getElementById('emp-dept-filter');
  if (select) {
    const current = select.value;
    const depts = getDepartments();
    select.innerHTML = `<option value="">${t('admin.emp.allDept')}</option>${depts
      .map((d) => `<option value="${escapeAttr(d)}" ${d === current ? 'selected' : ''}>${d}</option>`)
      .join('')}`;
  }

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><p>${t('empty.employees')}</p></div>`;
    return;
  }

  grid.innerHTML = list
    .map(
      (e) => `
      <button type="button" class="emp-card" data-id="${e.id}">
        <span class="emp-dept">${e.department}</span>
        <span class="emp-name">${e.name}</span>
      </button>`
    )
    .join('');

  grid.querySelectorAll('.emp-card').forEach((card) => {
    card.addEventListener('click', () => openEditEmployee(card.dataset.id));
  });
}

/**
 * 직원 수정 모달을 엽니다.
 * @param {string} id
 */
function openEditEmployee(id) {
  const emp = getEmployeeById(id);
  if (!emp) return;
  document.getElementById('edit-emp-id').value = emp.id;
  document.getElementById('edit-emp-name').value = emp.name;
  document.getElementById('edit-emp-dept').value = emp.department;
  openModal('edit-emp-modal');
}

/**
 * 엑셀 업로드 결과를 처리합니다.
 * @param {File} file
 */
async function handleExcelImport(file) {
  try {
    setLoading(true, 'Uploading...');
    const result = await importEmployeesFromFile(file);
    showToast(
      `업로드 완료 · 총 ${result.total}명 · 신규 ${result.added}명 · 중복 ${result.duplicates}명`,
      'success'
    );
    renderEmployeeGrid();
  } catch (err) {
    showToast(err.message || '업로드 실패', 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * 관리자 일정 패널을 렌더링합니다.
 */
function renderAdminSchedule() {
  const yearMonth = toYearMonth(AppState.year, AppState.month);
  const schedule = getScheduleByMonth(yearMonth);
  const label = document.getElementById('admin-current-month');
  const empty = document.getElementById('admin-empty-state');
  const view = document.getElementById('admin-schedule-view');

  if (label) {
    label.textContent = `${AppState.year}.${String(AppState.month).padStart(2, '0')}`;
  }

  if (!view) return;

  if (!schedule.length) {
    if (empty) empty.hidden = false;
    view.hidden = true;
    view.innerHTML = '';
    return;
  }

  if (empty) empty.hidden = true;
  view.hidden = false;
  view.innerHTML = buildScheduleTableHTML(schedule, { editable: true });

  // 즉시 저장 바인딩
  view.querySelectorAll('.inline-select, .inline-note').forEach((el) => {
    el.addEventListener('change', () => {
      const dayId = el.dataset.day;
      const field = el.dataset.field;
      const value = el.value;
      const res = updateScheduleField(yearMonth, dayId, field, value);
      showToast(res.message, res.ok ? 'success' : 'error');
      if (res.ok && field !== 'note') renderAdminSchedule();
    });
  });
}

/**
 * 관리자 교환 목록을 렌더링합니다.
 */
function renderAdminSwaps() {
  const list = document.getElementById('admin-swap-list');
  const badge = document.getElementById('admin-swap-badge');
  if (!list) return;

  expireOldSwaps();
  const requests = getSwapRequests();
  const pending = requests.filter((r) => r.status === 'Pending').length;
  if (badge) {
    badge.hidden = pending === 0;
    badge.textContent = String(pending);
  }

  if (!requests.length) {
    list.innerHTML = `<div class="empty-state"><p>${t('empty.swaps')}</p></div>`;
    return;
  }

  list.innerHTML = requests
    .map(
      (r) => `
      <article class="swap-admin-card status-${r.status}">
        ${renderSwapRequestSummary(r)}
        ${
          r.status === 'Pending'
            ? `<div class="row-actions">
                <button type="button" class="btn btn-sm btn-primary" data-approve="${r.id}">${t('swap.approve')}</button>
                <button type="button" class="btn btn-sm btn-danger" data-reject="${r.id}">${t('swap.reject')}</button>
              </div>`
            : ''
        }
      </article>`
    )
    .join('');

  list.querySelectorAll('[data-approve]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = approveSwapRequest(btn.dataset.approve);
      showToast(res.message, res.ok ? 'success' : 'error');
      renderAdminSwaps();
      renderAdminSchedule();
    });
  });
  list.querySelectorAll('[data-reject]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = rejectSwapRequest(btn.dataset.reject, '관리자 거절');
      showToast(res.message, res.ok ? 'success' : 'error');
      renderAdminSwaps();
    });
  });
}

/**
 * 일정 생성 후 명단을 바로 표시합니다. (슬롯 모션 없음)
 */
function handleGenerateSchedule() {
  const employees = getEmployees();
  if (employees.length < 2) {
    showToast('직원이 2명 이상 필요합니다.', 'error');
    return;
  }

  const btn = document.getElementById('btn-generate');
  if (btn) btn.disabled = true;

  try {
    switchAdminTab('schedule');
    const result = generateMonthlySchedule(AppState.year, AppState.month);
    // 재생성 후 이번 주 슬롯 공개 상태 초기화 → 새 명단으로 다시 뽑을 수 있음
    storageSet(STORAGE_KEYS.REVEALED_WEEKS, {});
    renderAdminSchedule();
    const missing =
      result.meta.workdayCount !== result.schedule.length
        ? ` (경고: ${result.meta.workdayCount}일 중 ${result.schedule.length}일만 생성됨)`
        : '';
    showToast(
      (getLanguage() === 'zh' ? '日程生成完成' : '일정 생성 완료') + missing,
      missing ? 'warning' : 'success'
    );
  } catch (err) {
    showToast(err.message || '생성 실패', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

/**
 * admin.html 초기화
 */
function initAdminPage() {
  const session = requireAuth('admin');
  AppState.session = session;

  bindCommonUI();

  loadDefaultEmployees()
    .then((data) => initializeAppData(data))
    .finally(() => {
      // 매월 말일 자동 배정 (+ 놓친 경우 현재 달 백필)
      try {
        ensureAutoMonthlyAssignment();
      } catch (err) {
        console.error('auto assign failed', err);
      }

      document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchAdminTab(btn.dataset.tab));
      });

      document.getElementById('add-employee-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('emp-name').value;
        const dept = document.getElementById('emp-dept').value;
        const res = addEmployee(name, dept);
        showToast(res.message, res.ok ? 'success' : 'error');
        if (res.ok) {
          e.target.reset();
          renderEmployeeGrid();
        }
      });

      document.getElementById('emp-search')?.addEventListener('input', renderEmployeeGrid);
      document.getElementById('emp-dept-filter')?.addEventListener('change', renderEmployeeGrid);

      const fileInput = document.getElementById('excel-file-input');
      document.getElementById('btn-import-excel')?.addEventListener('click', () => fileInput?.click());
      fileInput?.addEventListener('change', () => {
        if (fileInput.files[0]) handleExcelImport(fileInput.files[0]);
        fileInput.value = '';
      });

      document.getElementById('btn-clear-employees')?.addEventListener('click', () => {
        if (!getEmployees().length) {
          showToast(t('admin.emp.clearEmpty'), 'error');
          return;
        }
        if (!confirm(t('admin.emp.clearConfirm'))) return;
        const res = deleteAllEmployees();
        showToast(res.message, res.ok ? 'success' : 'error');
        if (res.ok) renderEmployeeGrid();
      });

      const dropzone = document.getElementById('excel-dropzone');
      dropzone?.addEventListener('click', () => fileInput?.click());
      setupExcelDropZone(dropzone, handleExcelImport);

      document.getElementById('edit-employee-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-emp-id').value;
        const res = updateEmployee(id, {
          name: document.getElementById('edit-emp-name').value,
          department: document.getElementById('edit-emp-dept').value
        });
        showToast(res.message, res.ok ? 'success' : 'error');
        if (res.ok) {
          closeModal('edit-emp-modal');
          renderEmployeeGrid();
        }
      });

      document.getElementById('btn-delete-emp')?.addEventListener('click', () => {
        const id = document.getElementById('edit-emp-id').value;
        if (!confirm(getLanguage() === 'zh' ? '确定删除吗？' : '삭제하시겠습니까?')) return;
        const res = deleteEmployee(id);
        showToast(res.message, res.ok ? 'success' : 'error');
        if (res.ok) {
          closeModal('edit-emp-modal');
          renderEmployeeGrid();
        }
      });

      document.getElementById('admin-prev-month')?.addEventListener('click', () => {
        shiftMonth(-1);
        renderAdminSchedule();
      });
      document.getElementById('admin-next-month')?.addEventListener('click', () => {
        shiftMonth(1);
        renderAdminSchedule();
      });

      document.getElementById('btn-generate')?.addEventListener('click', handleGenerateSchedule);
      document.getElementById('btn-download')?.addEventListener('click', () => {
        try {
          downloadScheduleExcel(
            toYearMonth(AppState.year, AppState.month),
            getLanguage()
          );
          showToast(getLanguage() === 'zh' ? '下载完成' : '다운로드 완료', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });

      renderAdminSwaps();
      switchAdminTab('employees');
    });
}

/**
 * 페이지 부트스트랩
 */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body?.dataset?.page;
  if (page === 'index') initIndexPage();
  if (page === 'admin') initAdminPage();
});
