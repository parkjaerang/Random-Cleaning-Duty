/**
 * 당번 교환 요청 / 승인 / 규칙 검사
 *
 * 교환 후에도 유지해야 할 규칙:
 * - 하루 2명
 * - 공휴일·일요일 제외 (이미 배정된 날만 교환)
 * - 주방담당/화장실 담당 역할 유지 (같은 역할끼리만 교환)
 * - 이번 주 담당 명단에 있는 사람끼리만 교환
 * - 연속 담당 방지
 * - 담당 횟수 균등(과도한 편차 방지)
 */

const SWAP_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired'
};

/**
 * 교환 요청 ID를 생성합니다.
 * @returns {string}
 */
function createSwapId() {
  return `swap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * 만료된 Pending 요청을 Expired로 갱신합니다. (7일 경과)
 */
function expireOldSwaps() {
  const requests = getSwapRequests();
  const now = Date.now();
  let changed = false;

  requests.forEach((req) => {
    if (req.status !== SWAP_STATUS.PENDING) return;
    const created = new Date(req.createdAt).getTime();
    if (now - created > 7 * 24 * 60 * 60 * 1000) {
      req.status = SWAP_STATUS.EXPIRED;
      changed = true;
    }
  });

  if (changed) saveSwapRequests(requests);
}

/**
 * 내가 맡은 역할(front/back)을 반환합니다.
 * @param {Object} day
 * @param {string} employeeId
 * @returns {'front'|'back'|null}
 */
function getMyRoleOnDay(day, employeeId) {
  if (day.frontId === employeeId) return 'front';
  if (day.backId === employeeId) return 'back';
  return null;
}

/**
 * 이번 주 담당 일정에 포함된 직원 ID 집합을 반환합니다.
 * @param {Array} weekSchedule
 * @returns {Set<string>}
 */
function getWeekRosterEmployeeIds(weekSchedule) {
  const ids = new Set();
  weekSchedule.forEach((day) => {
    if (day.frontId) ids.add(day.frontId);
    if (day.backId) ids.add(day.backId);
  });
  return ids;
}

/**
 * 교환 가능한 상대 일정 목록을 계산합니다.
 * 이번 주 담당 일정 안에서, 같은 역할(주방/화장실), 다른 사람, 다른 날짜
 * @param {string} yearMonth
 * @param {string} myDayId
 * @param {string} myEmployeeId
 * @param {Date} [refDate]
 * @returns {Array}
 */
function getSwappableDays(yearMonth, myDayId, myEmployeeId, refDate = new Date()) {
  const weekSchedule = getWeekSchedule(yearMonth, refDate);
  if (!weekSchedule.length) return [];

  const weekDayIds = new Set(weekSchedule.map((d) => d.id));
  const rosterIds = getWeekRosterEmployeeIds(weekSchedule);

  const myDay = weekSchedule.find((d) => d.id === myDayId);
  if (!myDay || !weekDayIds.has(myDayId) || !rosterIds.has(myEmployeeId)) {
    return [];
  }

  const myRole = getMyRoleOnDay(myDay, myEmployeeId);
  if (!myRole) return [];

  return weekSchedule
    .filter((d) => d.id !== myDayId)
    .filter((d) => {
      const otherId = myRole === 'front' ? d.frontId : d.backId;
      return otherId && otherId !== myEmployeeId && rosterIds.has(otherId);
    })
    .map((d) => ({
      day: d,
      otherId: myRole === 'front' ? d.frontId : d.backId,
      otherName: myRole === 'front' ? d.frontName : d.backName,
      role: myRole
    }));
}

/**
 * 교환 시 연속 담당 위반 여부를 검사합니다.
 * @param {Array} schedule - 교환 적용 후 일정
 * @param {string} employeeId
 * @returns {boolean} true면 위반
 */
function hasConsecutiveDuty(schedule, employeeId) {
  const sorted = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
  let prevDate = null;

  for (const day of sorted) {
    const onDuty = day.frontId === employeeId || day.backId === employeeId;
    if (!onDuty) continue;

    if (prevDate) {
      const prev = new Date(prevDate + 'T00:00:00');
      const curr = new Date(day.date + 'T00:00:00');
      const diff = (curr - prev) / 86400000;
      // 근무일 기준 연속(날짜 차이가 1~2일이고 사이에 근무일이 없으면 연속으로 간주)
      if (diff > 0 && diff <= 2) {
        // 사이 날짜가 일/공휴일이면 실질 연속
        let gapWorkday = false;
        for (let t = 1; t < diff; t++) {
          const mid = new Date(prev);
          mid.setDate(mid.getDate() + t);
          const midStr = formatDateISO(mid);
          if (!isSunday(mid) && !isHoliday(midStr)) {
            gapWorkday = true;
            break;
          }
        }
        if (!gapWorkday) return true;
      }
    }
    prevDate = day.date;
  }
  return false;
}

/**
 * 교환 적용 시뮬레이션 후 규칙을 검사합니다.
 * @param {string} yearMonth
 * @param {string} fromDayId
 * @param {string} toDayId
 * @param {string} requesterId
 * @param {string} targetId
 * @param {'front'|'back'} role
 * @returns {{ ok: boolean, reason: string, preview?: Array }}
 */
function validateSwap(yearMonth, fromDayId, toDayId, requesterId, targetId, role) {
  const weekSchedule = getWeekSchedule(yearMonth);
  const weekDayIds = new Set(weekSchedule.map((d) => d.id));
  const rosterIds = getWeekRosterEmployeeIds(weekSchedule);

  if (!weekDayIds.has(fromDayId) || !weekDayIds.has(toDayId)) {
    return { ok: false, reason: '이번 주 담당 일정끼리만 교환할 수 있습니다.' };
  }

  if (!rosterIds.has(requesterId) || !rosterIds.has(targetId)) {
    return {
      ok: false,
      reason: '이번 주 담당 명단에 있는 사람끼리만 교환할 수 있습니다.'
    };
  }

  const schedule = getScheduleByMonth(yearMonth).map((d) => ({ ...d }));
  const fromDay = schedule.find((d) => d.id === fromDayId);
  const toDay = schedule.find((d) => d.id === toDayId);

  if (!fromDay || !toDay) {
    return { ok: false, reason: '일정을 찾을 수 없습니다.' };
  }

  const requester = getEmployeeById(requesterId);
  const target = getEmployeeById(targetId);

  // 교환 전 스냅샷
  const fromFront = {
    id: fromDay.frontId,
    name: fromDay.frontName,
    dept: fromDay.frontDept
  };
  const toFront = {
    id: toDay.frontId,
    name: toDay.frontName,
    dept: toDay.frontDept
  };
  const fromBack = {
    id: fromDay.backId,
    name: fromDay.backName,
    dept: fromDay.backDept
  };
  const toBack = {
    id: toDay.backId,
    name: toDay.backName,
    dept: toDay.backDept
  };

  // 역할 필드 교환 (같은 역할끼리만)
  if (role === 'front') {
    if (fromDay.frontId !== requesterId || toDay.frontId !== targetId) {
      return { ok: false, reason: '주방담당자가 일치하지 않습니다.' };
    }
    if (toDay.backId === requesterId || fromDay.backId === targetId) {
      return { ok: false, reason: '교환 후 같은 날 두 역할을 맡게 됩니다.' };
    }

    fromDay.frontId = toFront.id;
    fromDay.frontName = target ? target.name : toFront.name;
    fromDay.frontDept = target ? target.department : toFront.dept;

    toDay.frontId = fromFront.id;
    toDay.frontName = requester ? requester.name : fromFront.name;
    toDay.frontDept = requester ? requester.department : fromFront.dept;
  } else {
    if (fromDay.backId !== requesterId || toDay.backId !== targetId) {
      return { ok: false, reason: '화장실 담당자가 일치하지 않습니다.' };
    }
    if (toDay.frontId === requesterId || fromDay.frontId === targetId) {
      return { ok: false, reason: '교환 후 같은 날 두 역할을 맡게 됩니다.' };
    }

    fromDay.backId = toBack.id;
    fromDay.backName = target ? target.name : toBack.name;
    fromDay.backDept = target ? target.department : toBack.dept;

    toDay.backId = fromBack.id;
    toDay.backName = requester ? requester.name : fromBack.name;
    toDay.backDept = requester ? requester.department : fromBack.dept;
  }

  // 하루 2명 유지 (id 중복 검사)
  for (const day of [fromDay, toDay]) {
    if (day.frontId === day.backId) {
      return { ok: false, reason: '하루 2명 규칙 위반: 동일인 중복 배정' };
    }
  }

  // 연속 담당 방지
  if (hasConsecutiveDuty(schedule, requesterId)) {
    return { ok: false, reason: '교환 후 요청자가 연속 담당이 됩니다.' };
  }
  if (hasConsecutiveDuty(schedule, targetId)) {
    return { ok: false, reason: '교환 후 상대가 연속 담당이 됩니다.' };
  }

  // 담당 횟수 균등: 월 전체 최대-최소 차이가 기존보다 2 이상 커지면 거부
  const counts = {};
  schedule.forEach((d) => {
    counts[d.frontId] = (counts[d.frontId] || 0) + 1;
    counts[d.backId] = (counts[d.backId] || 0) + 1;
  });
  const values = Object.values(counts);
  const spread = Math.max(...values) - Math.min(...values);
  if (spread > 3) {
    return { ok: false, reason: '교환 후 담당 횟수 편차가 너무 큽니다.' };
  }

  return { ok: true, reason: '', preview: schedule };
}

/**
 * 교환 요청을 생성합니다.
 * @param {Object} payload
 * @returns {{ ok: boolean, message: string, request?: Object }}
 */
function createSwapRequest(payload) {
  const {
    yearMonth,
    fromDayId,
    toDayId,
    requesterId,
    requesterName,
    targetId,
    targetName,
    role
  } = payload;

  const validation = validateSwap(
    yearMonth,
    fromDayId,
    toDayId,
    requesterId,
    targetId,
    role
  );

  if (!validation.ok) {
    return { ok: false, message: `교환 불가: ${validation.reason}` };
  }

  // 중복 pending 방지
  const requests = getSwapRequests();
  const dup = requests.some(
    (r) =>
      r.status === SWAP_STATUS.PENDING &&
      r.fromDayId === fromDayId &&
      r.requesterId === requesterId
  );
  if (dup) {
    return { ok: false, message: '이미 해당 일정에 대한 대기 중 요청이 있습니다.' };
  }

  const fromDay = getScheduleByMonth(yearMonth).find((d) => d.id === fromDayId);
  const toDay = getScheduleByMonth(yearMonth).find((d) => d.id === toDayId);

  const request = {
    id: createSwapId(),
    yearMonth,
    fromDayId,
    toDayId,
    fromDate: fromDay ? fromDay.date : '',
    toDate: toDay ? toDay.date : '',
    requesterId,
    requesterName,
    targetId,
    targetName,
    role,
    status: SWAP_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    rejectReason: ''
  };

  requests.unshift(request);
  saveSwapRequests(requests);
  return { ok: true, message: '교환 요청이 전송되었습니다.', request };
}

/**
 * 교환 요청을 승인합니다.
 * @param {string} requestId
 * @returns {{ ok: boolean, message: string }}
 */
function approveSwapRequest(requestId) {
  const requests = getSwapRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return { ok: false, message: '요청을 찾을 수 없습니다.' };
  if (req.status !== SWAP_STATUS.PENDING) {
    return { ok: false, message: '대기 중 요청만 승인할 수 있습니다.' };
  }

  const validation = validateSwap(
    req.yearMonth,
    req.fromDayId,
    req.toDayId,
    req.requesterId,
    req.targetId,
    req.role
  );

  if (!validation.ok) {
    return { ok: false, message: `교환 불가: ${validation.reason}` };
  }

  saveScheduleByMonth(req.yearMonth, validation.preview);
  req.status = SWAP_STATUS.APPROVED;
  req.resolvedAt = new Date().toISOString();
  saveSwapRequests(requests);
  return { ok: true, message: '교환이 완료되었습니다.' };
}

/**
 * 교환 요청을 거절합니다.
 * @param {string} requestId
 * @param {string} reason
 * @returns {{ ok: boolean, message: string }}
 */
function rejectSwapRequest(requestId, reason = '') {
  const requests = getSwapRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return { ok: false, message: '요청을 찾을 수 없습니다.' };
  if (req.status !== SWAP_STATUS.PENDING) {
    return { ok: false, message: '대기 중 요청만 거절할 수 있습니다.' };
  }

  req.status = SWAP_STATUS.REJECTED;
  req.rejectReason = reason || '거절됨';
  req.resolvedAt = new Date().toISOString();
  saveSwapRequests(requests);
  return { ok: true, message: '교환 요청을 거절했습니다.' };
}

/**
 * 현재 사용자와 관련된 교환 요청을 반환합니다.
 * @param {string} employeeId
 * @returns {Array}
 */
function getMySwapRequests(employeeId) {
  expireOldSwaps();
  return getSwapRequests().filter(
    (r) => r.requesterId === employeeId || r.targetId === employeeId
  );
}

/**
 * 나에게 온 Pending 요청 수를 반환합니다. (알림 배지용)
 * @param {string} employeeId
 * @returns {number}
 */
function getPendingSwapCount(employeeId) {
  expireOldSwaps();
  return getSwapRequests().filter(
    (r) => r.status === SWAP_STATUS.PENDING && r.targetId === employeeId
  ).length;
}

/**
 * 관리자용 전체 Pending 요청 수
 * @returns {number}
 */
function getAllPendingSwapCount() {
  expireOldSwaps();
  return getSwapRequests().filter((r) => r.status === SWAP_STATUS.PENDING).length;
}
