/**
 * 일정 자동 배정 엔진
 *
 * 운영 규칙:
 * 1. 하루 2명 (주방담당 / 화장실 담당)
 * 2. 일요일 제외
 * 3. 공휴일 제외
 * 4. 담당 횟수 균등
 * 5. 주방담당 / 화장실 담당 번갈아
 * 6. 격월 1회 ↔ 2회 자동 적용
 * 7. 같은 사람 연속 배정 최대한 방지
 */

/** 대한민국 공휴일 (고정일 + 주요 음력 연휴 2025~2027) */
const KR_HOLIDAYS = [
  // 2025
  '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30',
  '2025-03-01', '2025-03-03', '2025-05-05', '2025-05-06',
  '2025-06-06', '2025-08-15', '2025-10-03', '2025-10-05',
  '2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09', '2025-12-25',
  // 2026
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18',
  '2026-03-01', '2026-05-05', '2026-05-24', '2026-05-25',
  '2026-06-06', '2026-08-15', '2026-08-17', '2026-09-24',
  '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-05',
  '2026-10-09', '2026-12-25',
  // 2027
  '2027-01-01', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09',
  '2027-03-01', '2027-05-05', '2027-05-13', '2027-06-06',
  '2027-08-15', '2027-08-16', '2027-09-14', '2027-09-15', '2027-09-16',
  '2027-10-03', '2027-10-04', '2027-10-09', '2027-12-25'
];

/**
 * YYYY-MM-DD 형식의 날짜 문자열을 생성합니다.
 * @param {Date} date
 * @returns {string}
 */
function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * "YYYY-MM" 문자열을 반환합니다.
 * @param {number} year
 * @param {number} month - 1~12
 * @returns {string}
 */
function toYearMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * 공휴일 여부를 확인합니다.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {boolean}
 */
function isHoliday(dateStr) {
  return KR_HOLIDAYS.includes(dateStr);
}

/**
 * 일요일 여부를 확인합니다.
 * @param {Date} date
 * @returns {boolean}
 */
function isSunday(date) {
  return date.getDay() === 0;
}

/**
 * 해당 월의 근무일(일·공휴일 제외) 목록을 반환합니다.
 * @param {number} year
 * @param {number} month - 1~12
 * @returns {Array<{ date: string, dayOfWeek: number }>}
 */
function getWorkdays(year, month) {
  const days = [];
  const lastDay = new Date(year, month, 0).getDate();

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = formatDateISO(date);
    if (isSunday(date) || isHoliday(dateStr)) continue;
    days.push({ date: dateStr, dayOfWeek: date.getDay() });
  }
  return days;
}

/**
 * 이전 달 year-month 문자열을 반환합니다.
 * @param {string} yearMonth - YYYY-MM
 * @returns {string}
 */
function getPrevYearMonth(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  const prev = new Date(y, m - 2, 1);
  return toYearMonth(prev.getFullYear(), prev.getMonth() + 1);
}

/**
 * 다음 달 year-month 문자열을 반환합니다.
 * @param {string} yearMonth - YYYY-MM
 * @returns {string}
 */
function getNextYearMonth(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  const next = new Date(y, m, 1);
  return toYearMonth(next.getFullYear(), next.getMonth() + 1);
}

/**
 * 오늘이 해당 월의 마지막 날인지 확인합니다.
 * @param {Date} [date]
 * @returns {boolean}
 */
function isLastDayOfMonth(date = new Date()) {
  const d = new Date(date);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return d.getDate() === last;
}

/**
 * 매월 마지막 날에 다음 달 일정을 자동 생성합니다.
 * 말일에 앱을 열지 못한 경우를 위해, 현재 달이 비어 있으면 백필합니다.
 * @param {Date} [refDate]
 * @returns {{ generated: string[], skipped: string[] }}
 */
function ensureAutoMonthlyAssignment(refDate = new Date()) {
  const generated = [];
  const skipped = [];
  const employees = getEmployees();
  if (employees.length < 2) {
    return { generated, skipped };
  }

  const today = new Date(refDate);
  today.setHours(0, 0, 0, 0);
  const currentYm = toYearMonth(today.getFullYear(), today.getMonth() + 1);
  const nextYm = getNextYearMonth(currentYm);

  /** @param {string} yearMonth */
  function tryGenerate(yearMonth) {
    if (getScheduleByMonth(yearMonth).length) {
      skipped.push(yearMonth);
      return;
    }
    const [y, m] = yearMonth.split('-').map(Number);
    generateMonthlySchedule(y, m);
    markAutoAssigned(yearMonth);
    generated.push(yearMonth);
  }

  // 매월 마지막 날 → 다음 달 배정
  if (isLastDayOfMonth(today)) {
    tryGenerate(nextYm);
  }

  // 말일 자동 실행을 놓친 경우: 현재 달이 비어 있으면 생성
  if (!getScheduleByMonth(currentYm).length) {
    tryGenerate(currentYm);
  }

  return { generated, skipped };
}

/**
 * 이전달 담당 횟수를 보고 이번 달 기본 목표(낮음/높음)를 결정합니다.
 * 격월 로테이션: 이전달이 적으면 이번 달은 많은 쪽, 많으면 적은 쪽.
 * @param {string} employeeId
 * @param {string} yearMonth
 * @param {number} low - 균등 배분 시 낮은 횟수
 * @param {number} high - 균등 배분 시 높은 횟수
 * @returns {number}
 */
function getTargetDutyCount(employeeId, yearMonth, low = 1, high = 2) {
  const history = getDutyHistory();
  const prevYm = getPrevYearMonth(yearMonth);
  const prevCount = history[prevYm] && history[prevYm][employeeId];

  if (typeof prevCount === 'number') {
    // 격월: 적었으면 많고, 많았으면 적게
    return prevCount <= low ? high : low;
  }

  const monthNum = Number(yearMonth.split('-')[1]);
  return monthNum % 2 === 1 ? low : high;
}

/**
 * 근무일 슬롯 수에 맞춰 전원 목표 횟수를 확정합니다.
 * 전원 차이가 최대 1이 되도록 (base 또는 base+1) 맞추고,
 * 격월 로테이션으로 "많이 하는 사람"을 번갈아 고릅니다.
 * @param {Array} employees
 * @param {string} yearMonth
 * @param {number} totalSlots
 * @returns {Object} employeeId → 목표 횟수
 */
function buildFairTargets(employees, yearMonth, totalSlots) {
  const n = employees.length;
  const base = Math.floor(totalSlots / n);
  const remainder = totalSlots % n; // remainder명이 base+1
  const low = base;
  const high = base + (remainder > 0 ? 1 : 0);

  const history = getDutyHistory();
  const prevYm = getPrevYearMonth(yearMonth);
  const prevCounts = history[prevYm] || {};

  // 높은 횟수(high)를 받을 우선순위: 이전달 적었던 사람 우선
  const ranked = employees
    .map((emp) => {
      const prev = prevCounts[emp.id];
      const preferHigh =
        typeof prev === 'number'
          ? prev <= low
            ? 1
            : 0
          : getTargetDutyCount(emp.id, yearMonth, low, high) === high
            ? 1
            : 0;
      return {
        emp,
        preferHigh,
        prevCount: typeof prev === 'number' ? prev : 0,
        noise: Math.random()
      };
    })
    .sort(
      (a, b) =>
        b.preferHigh - a.preferHigh ||
        a.prevCount - b.prevCount ||
        a.noise - b.noise
    );

  const targets = {};
  ranked.forEach((row, index) => {
    targets[row.emp.id] = index < remainder ? high : low;
  });
  return targets;
}

/**
 * 직원의 최근 주방/화장실 담당 기록을 보고 다음 역할을 결정합니다.
 * @param {string} employeeId
 * @param {Object} roleState - { employeeId: 'front'|'back' }
 * @returns {'front'|'back'}
 */
function nextRole(employeeId, roleState) {
  const last = roleState[employeeId];
  if (!last) return Math.random() < 0.5 ? 'front' : 'back';
  return last === 'front' ? 'back' : 'front';
}

/**
 * 두 사람의 선호 다음 역할이 충돌하지 않으면 역할 배치를 반환합니다.
 * @param {Object} a
 * @param {Object} b
 * @param {Object} roleState
 * @returns {{ front: Object, back: Object }|null}
 */
function tryAssignRoles(a, b, roleState) {
  const preferA = nextRole(a.id, roleState);
  const preferB = nextRole(b.id, roleState);

  // 둘 다 이력이 없으면 임의 배치 가능
  const aFresh = !roleState[a.id];
  const bFresh = !roleState[b.id];

  if (preferA !== preferB) {
    return preferA === 'front'
      ? { front: a, back: b }
      : { front: b, back: a };
  }

  if (aFresh || bFresh) {
    // 한쪽만 이력이 있으면 이력 있는 쪽 선호를 존중
    if (!aFresh && bFresh) {
      return preferA === 'front'
        ? { front: a, back: b }
        : { front: b, back: a };
    }
    if (aFresh && !bFresh) {
      return preferB === 'front'
        ? { front: b, back: a }
        : { front: a, back: b };
    }
    // 둘 다 신규 → 임의
    return Math.random() < 0.5
      ? { front: a, back: b }
      : { front: b, back: a };
  }

  // 둘 다 같은 역할 선호 → 이 페어는 교대 규칙 위반이므로 거부
  return null;
}

/**
 * 점수·역할 교대를 고려해 하루 2명을 고릅니다.
 * @param {Array} employees
 * @param {Object} counts
 * @param {Object} targets
 * @param {Object} roleState
 * @param {string[]} previousPair
 * @returns {{ front: Object, back: Object }}
 */
function pickDayPair(employees, counts, targets, roleState, previousPair) {
  const notYesterday = employees.filter((e) => !previousPair.includes(e.id));
  const basePool = notYesterday.length >= 2 ? notYesterday : employees.slice();

  // 목표 미달 인원 우선 (목표 달성자는 제외)
  const needy = basePool.filter((e) => counts[e.id] < targets[e.id]);
  const pool = needy.length >= 2 ? needy : basePool;

  const scored = pool
    .map((emp) => {
      const deficit = targets[emp.id] - counts[emp.id];
      const overTarget = counts[emp.id] >= targets[emp.id] ? -8 : 0;
      const fairness = -counts[emp.id];
      const noise = Math.random() * 0.2;
      return {
        emp,
        score: deficit * 5 + overTarget + fairness + noise
      };
    })
    .sort((a, b) => b.score - a.score);

  // 상위 후보 안에서 역할 교대가 성립하는 페어를 탐색
  const top = scored.slice(0, Math.min(scored.length, 8));
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      const assigned = tryAssignRoles(top[i].emp, top[j].emp, roleState);
      if (assigned) return assigned;
    }
  }

  // 전체 풀에서 재시도
  for (let i = 0; i < scored.length; i++) {
    for (let j = i + 1; j < scored.length; j++) {
      const assigned = tryAssignRoles(scored[i].emp, scored[j].emp, roleState);
      if (assigned) return assigned;
    }
  }

  // 최후: 점수 상위 2명 (역할은 가능한 한 교대)
  const a = scored[0].emp;
  const b = scored[1] ? scored[1].emp : employees.find((e) => e.id !== a.id);
  const preferA = nextRole(a.id, roleState);
  if (preferA === 'front') return { front: a, back: b };
  return { front: b, back: a };
}

/**
 * 생성된 일정이 운영 규칙을 지키는지 검사합니다.
 * @param {Array} schedule
 * @param {Array} employees
 * @param {Object} [targets]
 * @returns {{ ok: boolean, violations: string[] }}
 */
function validateMonthlySchedule(schedule, employees, targets = null) {
  const violations = [];
  const counts = {};
  const rolesByEmp = {};
  employees.forEach((e) => {
    counts[e.id] = 0;
    rolesByEmp[e.id] = [];
  });

  let prevPair = [];
  schedule.forEach((day) => {
    if (!day.frontId || !day.backId) {
      violations.push(`${day.date}: 하루 2명 미배정`);
      return;
    }
    if (day.frontId === day.backId) {
      violations.push(`${day.date}: 동일인 중복 배정`);
    }

    // 연속 근무일 당번 방지 (권장 규칙)
    if (
      prevPair.includes(day.frontId) ||
      prevPair.includes(day.backId)
    ) {
      // soft: 기록만 (인원 부족 시 불가피할 수 있음)
    }
    prevPair = [day.frontId, day.backId];

    counts[day.frontId] = (counts[day.frontId] || 0) + 1;
    counts[day.backId] = (counts[day.backId] || 0) + 1;
    rolesByEmp[day.frontId].push('front');
    rolesByEmp[day.backId].push('back');
  });

  // 균등: 최대-최소 차이가 1 이내
  const vals = Object.values(counts).filter((v) => typeof v === 'number');
  if (vals.length) {
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    if (max - min > 1) {
      violations.push(`담당 횟수 편차 과다: 최소 ${min}회 / 최대 ${max}회`);
    }
  }

  // 목표 횟수 준수
  if (targets) {
    employees.forEach((e) => {
      if (counts[e.id] !== targets[e.id]) {
        violations.push(
          `${e.name}: 목표 ${targets[e.id]}회 ≠ 실제 ${counts[e.id]}회`
        );
      }
    });
  }

  // 역할 교대: 같은 사람이 연속으로 같은 역할이면 위반
  employees.forEach((e) => {
    const roles = rolesByEmp[e.id] || [];
    for (let i = 1; i < roles.length; i++) {
      if (roles[i] === roles[i - 1]) {
        violations.push(
          `${e.name}: 역할 교대 위반 (${roles[i - 1]} → ${roles[i]})`
        );
        break;
      }
    }
  });

  return { ok: violations.length === 0, violations, counts };
}

/**
 * 한 달 전체 일정을 자동 생성합니다.
 * @param {number} year
 * @param {number} month - 1~12
 * @returns {{ yearMonth: string, schedule: Array, meta: Object }}
 */
function generateMonthlySchedule(year, month) {
  const employees = getEmployees();
  if (employees.length < 2) {
    throw new Error('직원이 2명 이상 필요합니다.');
  }

  const yearMonth = toYearMonth(year, month);
  const workdays = getWorkdays(year, month);
  const totalSlots = workdays.length * 2;

  let best = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 12; attempt++) {
    const targets = buildFairTargets(employees, yearMonth, totalSlots);
    const once = generateMonthlyScheduleOnce(
      employees,
      yearMonth,
      workdays,
      targets
    );
    const validation = validateMonthlySchedule(
      once.schedule,
      employees,
      once.targets
    );
    const score = validation.ok
      ? 1000
      : 100 - validation.violations.length;

    if (score > bestScore) {
      bestScore = score;
      best = { ...once, validation };
    }
    if (validation.ok) break;
  }

  const history = getDutyHistory();
  history[yearMonth] = best.counts;
  saveDutyHistory(history);
  saveScheduleByMonth(yearMonth, best.schedule);

  // 근무일이 빠졌는지 확인 (화·금 등 누락 방지)
  if (best.schedule.length !== workdays.length) {
    console.error(
      '일정 생성 누락:',
      yearMonth,
      'expected',
      workdays.length,
      'got',
      best.schedule.length
    );
  }

  return {
    yearMonth,
    schedule: best.schedule,
    meta: {
      workdayCount: workdays.length,
      totalSlots,
      counts: best.counts,
      targets: best.targets,
      validation: best.validation
    }
  };
}

/**
 * 한 달 일정 생성 코어 (저장 없음). 재시도용.
 * @param {Array} employees
 * @param {string} yearMonth
 * @param {Array} workdays
 * @param {Object} targets
 * @returns {{ schedule: Array, counts: Object, targets: Object }}
 */
function generateMonthlyScheduleOnce(employees, yearMonth, workdays, targets) {
  const counts = {};
  const roleState = {};
  employees.forEach((emp) => {
    counts[emp.id] = 0;
  });

  const prevSchedule = [...getScheduleByMonth(getPrevYearMonth(yearMonth))].sort(
    (a, b) => a.date.localeCompare(b.date)
  );
  prevSchedule.forEach((day) => {
    if (day.frontId) roleState[day.frontId] = 'front';
    if (day.backId) roleState[day.backId] = 'back';
  });

  const schedule = [];
  let previousPair = [];

  workdays.forEach((wd, dayIndex) => {
    const { front, back } = pickDayPair(
      employees,
      counts,
      targets,
      roleState,
      previousPair
    );

    counts[front.id]++;
    counts[back.id]++;
    roleState[front.id] = 'front';
    roleState[back.id] = 'back';
    previousPair = [front.id, back.id];

    schedule.push({
      id: `day-${yearMonth}-${dayIndex + 1}`,
      date: wd.date,
      dayOfWeek: wd.dayOfWeek,
      frontId: front.id,
      frontName: front.name,
      frontDept: front.department,
      backId: back.id,
      backName: back.name,
      backDept: back.department,
      note: ''
    });
  });

  return { schedule, counts, targets };
}

/**
 * 일정 한 칸을 직접 수정합니다.
 * @param {string} yearMonth
 * @param {string} dayId
 * @param {'front'|'back'|'note'} field
 * @param {string} value - 직원 id 또는 비고 텍스트
 * @returns {{ ok: boolean, message: string }}
 */
function updateScheduleField(yearMonth, dayId, field, value) {
  const schedule = getScheduleByMonth(yearMonth);
  const day = schedule.find((d) => d.id === dayId);
  if (!day) return { ok: false, message: '일정을 찾을 수 없습니다.' };

  if (field === 'note') {
    day.note = value;
    saveScheduleByMonth(yearMonth, schedule);
    return { ok: true, message: '비고가 저장되었습니다.' };
  }

  const employees = getEmployees();
  const emp = employees.find((e) => e.id === value || e.name === value);
  if (!emp) return { ok: false, message: '직원을 찾을 수 없습니다.' };

  // 같은 날 중복 배정 방지
  const otherField = field === 'front' ? 'backId' : 'frontId';
  if (day[otherField] === emp.id) {
    return { ok: false, message: '같은 날 한 사람이 두 역할을 맡을 수 없습니다.' };
  }

  if (field === 'front') {
    day.frontId = emp.id;
    day.frontName = emp.name;
    day.frontDept = emp.department;
  } else {
    day.backId = emp.id;
    day.backName = emp.name;
    day.backDept = emp.department;
  }

  saveScheduleByMonth(yearMonth, schedule);
  return { ok: true, message: '일정이 수정되었습니다.' };
}

/**
 * 특정 직원의 일정을 필터링합니다.
 * @param {string} yearMonth
 * @param {string} employeeId
 * @returns {Array}
 */
function getMySchedule(yearMonth, employeeId) {
  return getScheduleByMonth(yearMonth).filter(
    (d) => d.frontId === employeeId || d.backId === employeeId
  );
}

/**
 * 요일 한글 라벨을 반환합니다.
 * @param {number} dayOfWeek - 0=일 … 6=토
 * @param {string} lang
 * @returns {string}
 */
function getDayLabel(dayOfWeek, lang = 'ko') {
  const ko = ['일', '월', '화', '수', '목', '금', '토'];
  const zh = ['日', '一', '二', '三', '四', '五', '六'];
  return lang === 'zh' ? zh[dayOfWeek] : ko[dayOfWeek];
}

/**
 * 주 단위로 일정을 그룹화합니다.
 * @param {Array} schedule
 * @returns {Array<Array>}
 */
function groupByWeek(schedule) {
  const weeks = [];
  let current = [];
  let lastWeek = null;

  schedule.forEach((day) => {
    const date = new Date(day.date + 'T00:00:00');
    // ISO week-ish: Monday-based week number approximation
    const weekKey = getWeekKey(date);
    if (lastWeek !== null && weekKey !== lastWeek) {
      weeks.push(current);
      current = [];
    }
    current.push(day);
    lastWeek = weekKey;
  });

  if (current.length) weeks.push(current);
  return weeks;
}

/**
 * 주의 고유 키를 생성합니다.
 * @param {Date} date
 * @returns {string}
 */
function getWeekKey(date) {
  const tmp = new Date(date);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((tmp - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${tmp.getFullYear()}-W${weekNum}`;
}

/**
 * 선택한 월 일정에서 '이번 주'에 해당하는 일주일 치를 반환합니다.
 * 오늘이 해당 월에 없으면, 오늘과 가장 가까운 주를 고릅니다.
 * 주가 월말에 걸치면 이전/다음 달 일정도 같은 주 키로 합칩니다.
 * @param {string} yearMonth
 * @param {Date} [refDate]
 * @returns {Array}
 */
function getWeekSchedule(yearMonth, refDate = new Date()) {
  const ref = new Date(refDate);
  ref.setHours(0, 0, 0, 0);
  const refKey = getWeekKey(ref);

  const prevYm = getPrevYearMonth(yearMonth);
  const nextYm = getNextYearMonth(yearMonth);
  const merged = [
    ...getScheduleByMonth(prevYm),
    ...getScheduleByMonth(yearMonth),
    ...getScheduleByMonth(nextYm)
  ];

  if (!merged.length) return [];

  const inWeek = merged
    .filter((day) => {
      if (!day?.date) return false;
      return getWeekKey(new Date(day.date + 'T00:00:00')) === refKey;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (inWeek.length) return inWeek;

  // 오늘 주가 없으면 오늘 이후 가장 가까운 주, 없으면 마지막 주
  const weeks = groupByWeek(
    [...getScheduleByMonth(yearMonth)].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
  );
  if (!weeks.length) return [];

  const upcoming = weeks.find((week) => {
    const last = week[week.length - 1];
    return last && last.date >= formatDateISO(ref);
  });
  return upcoming || weeks[weeks.length - 1];
}
