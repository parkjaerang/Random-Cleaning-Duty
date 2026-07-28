/**
 * 직원 관리: 추가 / 수정 / 삭제 / 검색
 */

/**
 * 고유 직원 ID를 생성합니다.
 * @returns {string}
 */
function createEmployeeId() {
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 직원을 추가합니다. 동일 이름은 거부합니다.
 * @param {string} name
 * @param {string} department
 * @returns {{ ok: boolean, message: string, employee?: Object }}
 */
function addEmployee(name, department) {
  const trimmedName = (name || '').trim();
  const trimmedDept = (department || '').trim() || '미지정';

  if (!trimmedName) {
    return { ok: false, message: '이름을 입력해주세요.' };
  }

  const employees = getEmployees();
  if (employees.some((e) => e.name === trimmedName)) {
    return { ok: false, message: '이미 등록된 이름입니다.' };
  }

  const employee = {
    id: createEmployeeId(),
    name: trimmedName,
    department: trimmedDept
  };
  employees.push(employee);
  saveEmployees(employees);
  return { ok: true, message: '직원이 추가되었습니다.', employee };
}

/**
 * 직원 정보를 수정합니다.
 * @param {string} id
 * @param {{ name?: string, department?: string }} updates
 * @returns {{ ok: boolean, message: string }}
 */
function updateEmployee(id, updates) {
  const employees = getEmployees();
  const index = employees.findIndex((e) => e.id === id);
  if (index < 0) return { ok: false, message: '직원을 찾을 수 없습니다.' };

  const newName = (updates.name || employees[index].name).trim();
  const duplicate = employees.some((e) => e.id !== id && e.name === newName);
  if (duplicate) return { ok: false, message: '이미 등록된 이름입니다.' };

  employees[index] = {
    ...employees[index],
    name: newName,
    department: (updates.department || employees[index].department).trim()
  };
  saveEmployees(employees);

  // 일정에 표시된 이름/부서도 동기화
  syncEmployeeInSchedules(employees[index]);
  return { ok: true, message: '직원 정보가 수정되었습니다.' };
}

/**
 * 직원을 삭제합니다.
 * @param {string} id
 * @returns {{ ok: boolean, message: string }}
 */
function deleteEmployee(id) {
  const employees = getEmployees();
  const next = employees.filter((e) => e.id !== id);
  if (next.length === employees.length) {
    return { ok: false, message: '직원을 찾을 수 없습니다.' };
  }
  saveEmployees(next);
  return { ok: true, message: '직원이 삭제되었습니다.' };
}

/**
 * 전체 직원 명단을 삭제합니다.
 * @returns {{ ok: boolean, message: string, deleted: number }}
 */
function deleteAllEmployees() {
  const employees = getEmployees();
  const deleted = employees.length;
  if (!deleted) {
    return { ok: false, message: '삭제할 직원이 없습니다.', deleted: 0 };
  }
  saveEmployees([]);
  return {
    ok: true,
    message: `직원 ${deleted}명의 명단을 모두 삭제했습니다.`,
    deleted
  };
}

/**
 * 직원을 팀(부서) 가나다순 → 이름 가나다순으로 정렬합니다.
 * @param {Array} employees
 * @returns {Array}
 */
function sortEmployeesByDepartment(employees) {
  return [...employees].sort((a, b) => {
    const deptCmp = (a.department || '').localeCompare(b.department || '', 'ko');
    if (deptCmp !== 0) return deptCmp;
    return (a.name || '').localeCompare(b.name || '', 'ko');
  });
}

/**
 * 이름 또는 부서로 직원을 검색합니다.
 * @param {string} query
 * @param {string} departmentFilter - 빈 문자열이면 전체
 * @returns {Array}
 */
function searchEmployees(query, departmentFilter = '') {
  const q = (query || '').trim().toLowerCase();
  const dept = (departmentFilter || '').trim();

  return sortEmployeesByDepartment(
    getEmployees().filter((e) => {
      const matchQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q);
      const matchDept = !dept || e.department === dept;
      return matchQuery && matchDept;
    })
  );
}

/**
 * 부서 목록(중복 제거, 정렬)을 반환합니다.
 * @returns {string[]}
 */
function getDepartments() {
  const set = new Set(getEmployees().map((e) => e.department).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
}

/**
 * 엑셀에서 가져온 직원들을 병합합니다. 중복 이름은 제외합니다.
 * @param {Array<{ name: string, department: string }>} rows
 * @returns {{ total: number, added: number, duplicates: number }}
 */
function mergeEmployeesFromExcel(rows) {
  const employees = getEmployees();
  const existingNames = new Set(employees.map((e) => e.name));
  let added = 0;
  let duplicates = 0;

  rows.forEach((row) => {
    const name = (row.name || '').trim();
    const department = (row.department || '').trim() || '미지정';
    if (!name) return;

    if (existingNames.has(name)) {
      duplicates++;
      return;
    }

    employees.push({
      id: createEmployeeId(),
      name,
      department
    });
    existingNames.add(name);
    added++;
  });

  saveEmployees(employees);
  return {
    total: rows.filter((r) => (r.name || '').trim()).length,
    added,
    duplicates
  };
}

/**
 * 직원 이름/부서 변경 시 기존 일정을 동기화합니다.
 * @param {Object} employee
 */
function syncEmployeeInSchedules(employee) {
  const all = getSchedules();
  Object.keys(all).forEach((ym) => {
    all[ym] = all[ym].map((day) => {
      const next = { ...day };
      if (day.frontId === employee.id) {
        next.frontName = employee.name;
        next.frontDept = employee.department;
      }
      if (day.backId === employee.id) {
        next.backName = employee.name;
        next.backDept = employee.department;
      }
      return next;
    });
  });
  storageSet(STORAGE_KEYS.SCHEDULES, all);
}

/**
 * ID로 직원을 찾습니다.
 * @param {string} id
 * @returns {Object|null}
 */
function getEmployeeById(id) {
  return getEmployees().find((e) => e.id === id) || null;
}
