/**
 * 엑셀 업로드 / 다운로드 (SheetJS + FileSaver)
 * CDN: XLSX, FileSaver 사용
 */

/**
 * 엑셀 ArrayBuffer를 파싱하여 직원 행 배열로 변환합니다.
 * 기대 컬럼: 이름, 부서 (헤더 유연 매칭)
 * @param {ArrayBuffer} buffer
 * @returns {Array<{ name: string, department: string }>}
 */
function parseEmployeeExcel(buffer) {
  if (typeof XLSX === 'undefined') {
    throw new Error('XLSX 라이브러리가 로드되지 않았습니다.');
  }

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return rows
    .map((row) => {
      const name = pickField(row, ['이름', '성명', 'name', 'Name', '직원명']);
      const department = pickField(row, [
        '부서',
        '팀',
        '팀/파트',
        'department',
        'Department',
        '소속'
      ]);
      return { name: String(name).trim(), department: String(department).trim() };
    })
    .filter((r) => r.name);
}

/**
 * 객체에서 여러 후보 키 중 첫 값을 찾습니다.
 * @param {Object} row
 * @param {string[]} keys
 * @returns {string}
 */
function pickField(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  // 키 부분 일치
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const found = rowKeys.find((k) => k.includes(key));
    if (found) return row[found];
  }
  return '';
}

/**
 * 파일 input 또는 File 객체에서 직원을 가져와 병합합니다.
 * @param {File} file
 * @returns {Promise<{ total: number, added: number, duplicates: number }>}
 */
function importEmployeesFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('파일이 없습니다.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseEmployeeExcel(e.target.result);
        const result = mergeEmployeesFromExcel(rows);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 현재 일정을 엑셀(xlsx)로 다운로드합니다.
 * (한글 파일 형식 대체 — 표 + 당번 역할 시트)
 * @param {string} yearMonth
 * @param {string} lang
 */
function downloadScheduleExcel(yearMonth, lang = 'ko') {
  if (typeof XLSX === 'undefined') {
    throw new Error('XLSX 라이브러리가 로드되지 않았습니다.');
  }

  const schedule = getScheduleByMonth(yearMonth);
  if (!schedule.length) {
    throw new Error('다운로드할 일정이 없습니다.');
  }

  const isZh = lang === 'zh';
  const headers = isZh
    ? ['日期', '厨房负责人', '卫生间负责人', '备注']
    : ['날짜', '주방담당', '화장실 담당', '비고'];

  const dataRows = schedule.map((d) => [
    `${d.date} (${getDayLabel(d.dayOfWeek, lang)})`,
    `${d.frontName} (${d.frontDept || ''})`,
    `${d.backName} (${d.backDept || ''})`,
    d.note || ''
  ]);

  const wsSchedule = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

  const roleTitle = isZh ? '值班角色' : '당번 역할';
  const roleRows = isZh
    ? [
        [roleTitle],
        ['厨房负责人', '清理食物垃圾桶', '擦拭净水器周围'],
        ['卫生间负责人', '检查马桶座清洁剂', '检查并补充卫生纸'],
        ['备注', '当天无法清洁时，请提前与他人协商更换日期。']
      ]
    : [
        [roleTitle],
        ['주방담당', '음식물 쓰레기통 청소', '정수기 주변 닦기'],
        ['화장실 담당', '변기 시트 클리너 확인·보충', '화장실 휴지 확인·보충'],
        ['비고', '당일 청소가 어려운 경우, 미리 다른 분과 상의하여 날짜를 변경해 주세요.']
      ];

  const wsRoles = XLSX.utils.aoa_to_sheet(roleRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSchedule, isZh ? '值班表' : '당번표');
  XLSX.utils.book_append_sheet(wb, wsRoles, roleTitle);

  const filename = isZh
    ? `清洁值班表_${yearMonth}.xlsx`
    : `청소당번표_${yearMonth}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  if (typeof saveAs === 'function') {
    saveAs(blob, filename);
  } else {
    // FileSaver 미로드 시 fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * 직원 명단을 엑셀로 내보냅니다.
 * @param {string} lang
 */
function downloadEmployeeExcel(lang = 'ko') {
  if (typeof XLSX === 'undefined') {
    throw new Error('XLSX 라이브러리가 로드되지 않았습니다.');
  }

  const isZh = lang === 'zh';
  const headers = isZh ? ['姓名', '部门'] : ['이름', '부서'];
  const rows = getEmployees().map((e) => [e.name, e.department]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isZh ? '员工名单' : '직원명단');

  const filename = isZh ? '员工名单.xlsx' : '직원명단.xlsx';
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  if (typeof saveAs === 'function') {
    saveAs(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * 드래그앤드롭 영역을 초기화합니다.
 * @param {HTMLElement} dropZone
 * @param {Function} onFile - (File) => void
 */
function setupExcelDropZone(dropZone, onFile) {
  if (!dropZone) return;

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((evt) => {
    dropZone.addEventListener(evt, prevent);
  });

  dropZone.addEventListener('dragenter', () => dropZone.classList.add('drag-over'));
  dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'));
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onFile(file);
  });
}
