/**
 * 슬롯머신 추첨 애니메이션
 * CSS Animation + Vanilla JS only
 *
 * 흐름:
 * 일정 생성 → DAY별 슬롯 추첨
 * → 이름 점점 느려지며 확정 → 완료 후 명단 표시
 */

/**
 * 딜레이 Promise
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 릴 창 높이를 반환합니다.
 * @param {HTMLElement} reelEl
 * @returns {number}
 */
function reelItemHeight(reelEl) {
  return reelEl.getBoundingClientRect().height || 44;
}

/**
 * 수직 드럼 롤 — 이름 목록이 위→아래로 흘러 내려오다 당첨자에서 멈춥니다.
 * @param {HTMLElement} reelEl - .mini-window 또는 .slot-window 요소
 * @param {string[]} namePool  - 후보 이름 목록
 * @param {string}   finalName - 최종 확정 이름
 * @returns {Promise<void>}
 */
async function spinReel(reelEl, namePool, finalName) {
  const pool = namePool.length >= 2 ? namePool : [finalName, ...namePool];
  const itemH = reelItemHeight(reelEl);

  // 드럼 리스트 구성: 랜덤 이름 여러 개 + 마지막이 당첨자
  const SPIN_ROWS = 18; // 빠르게 지나갈 이름 수
  const names = [];
  for (let i = 0; i < SPIN_ROWS; i++) {
    names.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  names.push(finalName); // 마지막 = 당첨

  // 기존 내용 제거 후 drum-reel 삽입
  reelEl.innerHTML = '';
  reelEl.classList.remove('locked', 'glow');
  reelEl.classList.add('spinning');

  const reel = document.createElement('div');
  reel.className = 'drum-reel';
  names.forEach((n) => {
    const item = document.createElement('div');
    item.className = 'drum-item';
    item.textContent = n;
    reel.appendChild(item);
  });
  reelEl.appendChild(reel);

  const totalRows = names.length;
  const endY = -(totalRows - 1) * itemH; // 당첨자가 뷰포트 중앙에 오는 위치

  // 시작: 첫 번째 이름이 보이는 위치
  reel.style.transform = 'translateY(0px)';

  // easing 함수 (easeOutCubic)
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  const DURATION = 900; // ms
  const start = performance.now();

  await new Promise((resolve) => {
    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = easeOutCubic(t);
      const currentY = endY * eased;
      reel.style.transform = `translateY(${currentY}px)`;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        reel.style.transform = `translateY(${endY}px)`;
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });

  reelEl.classList.remove('spinning');
  reelEl.classList.add('locked', 'glow');
  await sleep(140);
}

/**
 * 기존 슬롯 요소에서 릴/레버를 찾습니다.
 * @param {HTMLElement} slotEl
 * @returns {{ reelFront: HTMLElement|null, reelBack: HTMLElement|null, lever: HTMLElement|null }}
 */
function resolveSlotParts(slotEl) {
  if (!slotEl) {
    return { reelFront: null, reelBack: null, lever: null };
  }
  const windows = slotEl.querySelectorAll('.mini-window, .slot-window');
  return {
    reelFront: windows[0] || null,
    reelBack: windows[1] || null,
    lever: slotEl.querySelector('.mini-lever, .slot-lever')
  };
}

/**
 * 일정 슬롯머신 애니메이션을 실행합니다.
 * existingSlot이 있으면 그 슬롯만 돌리고, 두 번째 슬롯 UI는 만들지 않습니다.
 *
 * @param {Object} options
 * @param {HTMLElement} options.panel - 상태/타이틀이 들어갈 패널 (또는 슬롯 상위)
 * @param {Array} options.schedule - 생성된 일정
 * @param {string[]} options.namePool - 직원 이름 목록
 * @param {HTMLElement} [options.existingSlot] - 재사용할 슬롯 머신 요소
 * @param {Function} [options.onComplete] - 완료 콜백
 * @param {Function} [options.onDayComplete] - 하루 확정 시 콜백 (day, index)
 * @param {string} [options.lang]
 * @param {string} [options.title]
 * @param {string} [options.doneText]
 * @param {boolean} [options.keepSlotVisible] - 완료 후 상태 레이어 유지
 * @param {number} [options.detailedCount] - 상세 애니메이션 일수 (기본 8)
 */
async function playSlotMachineAnimation(options) {
  const {
    panel,
    schedule,
    namePool,
    existingSlot = null,
    onComplete,
    onDayComplete,
    lang = 'ko',
    title,
    doneText,
    keepSlotVisible = false,
    detailedCount: detailedCountOpt
  } = options;
  if (!panel || !schedule || !schedule.length) return;

  const isZh = lang === 'zh';
  const runningTitle =
    title || (isZh ? '正在生成日程...' : '일정 생성중...');
  const finishText =
    doneText || (isZh ? '🎉 日程生成完成' : '🎉 일정 생성 완료');

  panel.classList.add('animating', 'has-content');

  Array.from(panel.children).forEach((child) => {
    child.dataset.prevHidden = child.hidden ? '1' : '0';
    child.hidden = true;
  });

  const useExisting = !!(existingSlot && resolveSlotParts(existingSlot).reelFront);
  let reelFront;
  let reelBack;
  let lever;

  const wrap = document.createElement('div');
  wrap.className = `slot-animation-wrap${useExisting ? ' slot-animation-wrap--chrome' : ''}`;
  wrap.setAttribute('data-slot-layer', '1');

  if (useExisting) {
    existingSlot.classList.add('is-spinning');
    const parts = resolveSlotParts(existingSlot);
    reelFront = parts.reelFront;
    reelBack = parts.reelBack;
    lever = parts.lever;

    wrap.innerHTML = `
      <div class="slot-header">
        <span class="slot-emoji">🎲</span>
        <h2 class="slot-title">${runningTitle}</h2>
      </div>
      <div class="slot-progress-track">
        <div class="slot-progress-bar" id="slot-progress-bar"></div>
      </div>
      <p class="slot-day-label" id="slot-day-label"></p>
    `;

    const footer = document.createElement('div');
    footer.className = 'slot-animation-footer';
    footer.setAttribute('data-slot-footer', '1');
    footer.innerHTML = `
      <p class="slot-status" id="slot-status"></p>
      <div class="slot-check" id="slot-check" hidden>✓</div>
    `;

    const parent = existingSlot.parentElement;
    if (parent) {
      parent.insertBefore(wrap, existingSlot);
      parent.insertBefore(footer, existingSlot.nextSibling);
    } else {
      panel.appendChild(wrap);
      panel.appendChild(footer);
    }
    wrap._slotFooter = footer;
  } else {
    wrap.innerHTML = `
      <div class="slot-header">
        <span class="slot-emoji">🎲</span>
        <h2 class="slot-title">${runningTitle}</h2>
      </div>
      <div class="slot-progress-track">
        <div class="slot-progress-bar" id="slot-progress-bar"></div>
      </div>
      <p class="slot-day-label" id="slot-day-label"></p>
      <div class="slot-machine">
        <div class="slot-window" id="slot-reel-front">—</div>
        <div class="slot-window" id="slot-reel-back">—</div>
        <div class="slot-lever">
          <div class="slot-lever-stick"></div>
          <div class="slot-lever-knob"></div>
        </div>
      </div>
      <p class="slot-status" id="slot-status"></p>
      <div class="slot-check" id="slot-check" hidden>✓</div>
    `;
    panel.appendChild(wrap);
    reelFront = wrap.querySelector('#slot-reel-front');
    reelBack = wrap.querySelector('#slot-reel-back');
    lever = wrap.querySelector('.slot-lever');
  }

  const progressBar = wrap.querySelector('#slot-progress-bar');
  const dayLabel = wrap.querySelector('#slot-day-label');
  const statusRoot = wrap._slotFooter || wrap;
  const status = statusRoot.querySelector('#slot-status');
  const check = statusRoot.querySelector('#slot-check');

  const total = schedule.length;
  const detailedCount =
    typeof detailedCountOpt === 'number'
      ? detailedCountOpt
      : Math.min(total, 8);

  for (let i = 0; i < total; i++) {
    const day = schedule[i];
    const dayNum = i + 1;
    dayLabel.textContent = `DAY ${dayNum}`;
    dayLabel.classList.add('fade-in');
    progressBar.style.width = `${(i / total) * 100}%`;

    if (lever) {
      lever.classList.add('pull');
      await sleep(90);
      lever.classList.remove('pull');
    }

    // 이전 drum-reel 초기화
    [reelFront, reelBack].forEach((el) => {
      el.innerHTML = '';
      el.classList.remove('locked', 'glow', 'spinning');
    });

    if (i < detailedCount) {
      status.textContent = isZh ? '抽取厨房负责人...' : '주방담당 추첨중...';
      await spinReel(reelFront, namePool, day.frontName);

      status.textContent = isZh ? '抽取卫生间负责人...' : '화장실 담당 추첨중...';
      await spinReel(reelBack, namePool, day.backName);

      status.textContent = isZh
        ? `DAY ${dayNum} 完成`
        : `DAY ${dayNum} 완료`;
      check.hidden = false;
      check.classList.add('pop');
      await sleep(150);
      check.classList.remove('pop');
      check.hidden = true;
    } else {
      // 빠른 모드: drum-reel 구조로 이름만 표시
      [reelFront, reelBack].forEach((el, idx) => {
        el.innerHTML = '';
        const reel = document.createElement('div');
        reel.className = 'drum-reel';
        const item = document.createElement('div');
        item.className = 'drum-item';
        item.textContent = idx === 0 ? day.frontName : day.backName;
        reel.appendChild(item);
        el.appendChild(reel);
        el.classList.add('locked');
      });
      status.textContent = isZh
        ? `DAY ${dayNum} 完成`
        : `DAY ${dayNum} 완료`;
      await sleep(30);
    }

    if (typeof onDayComplete === 'function') {
      onDayComplete(day, i);
    }

    dayLabel.classList.remove('fade-in');
  }

  progressBar.style.width = '100%';
  status.textContent = finishText;
  check.hidden = false;
  check.classList.add('pop');
  await sleep(350);

  if (useExisting) {
    existingSlot.classList.remove('is-spinning');
  }

  if (!keepSlotVisible) {
    wrap.remove();
    if (wrap._slotFooter) wrap._slotFooter.remove();
    Array.from(panel.children).forEach((child) => {
      if (child.dataset.prevHidden === '0') child.hidden = false;
      else if (child.dataset.prevHidden === '1') child.hidden = true;
      delete child.dataset.prevHidden;
    });
    if (!useExisting) {
      panel.classList.remove('has-content');
    }
  } else {
    Array.from(panel.children).forEach((child) => {
      delete child.dataset.prevHidden;
    });
    // 최종 이름은 슬롯에 남기고, 추첨 중 크롬만 제거
    if (useExisting) {
      wrap.remove();
      if (wrap._slotFooter) wrap._slotFooter.remove();
    }
  }

  panel.classList.remove('animating');
  if (typeof onComplete === 'function') {
    onComplete();
  }
}

/**
 * 슬롯머신 레버 클릭 시 추첨을 시작합니다.
 * @param {HTMLElement} machineEl
 * @param {Object} [options]
 * @param {() => void|Promise<void>} [options.onPull]
 */
function bindMiniSlotLever(machineEl, options = {}) {
  if (!machineEl) return;
  const lever = machineEl.querySelector('.mini-lever, .slot-lever');
  if (!lever) return;

  lever.addEventListener('click', async () => {
    if (machineEl.dataset.busy === '1') return;
    machineEl.dataset.busy = '1';

    lever.classList.add('pull');
    await sleep(220);
    lever.classList.remove('pull');

    try {
      if (typeof options.onPull === 'function') {
        await options.onPull();
      }
    } finally {
      machineEl.dataset.busy = '0';
    }
  });
}
