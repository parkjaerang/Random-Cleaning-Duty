/**
 * Right-panel decorative animation
 * PNG cleaning supplies fall top → bottom
 * Mouse = soft stone: objects split left/right and keep falling
 */
(function () {
  'use strict';

  const MOUSE_RADIUS = 40;
  const MIN_OBJECTS = 24;
  const MAX_OBJECTS = 50;
  const SUPPLY_GAP = 10;
  const SUPPLY_CATEGORY = 0x0002;
  const IMAGE_EXT = /\.(png|webp|svg)$/i;

  const FALLBACK_FILES = [
    'cleaning supplies1.png',
    'cleaning supplies2.png',
    'cleaning supplies3.png',
    'cleaning supplies4.png',
    'cleaning supplies5.png',
    'cleaning supplies6.png',
    'cleaning supplies7.png',
    'cleaning supplies8.png',
    'cleaning supplies9.png',
    'cleaning supplies10.png',
    'cleaning supplies11.png',
    'cleaning supplies12.png',
    'cleaning supplies13.png',
    'cleaning supplies14.png',
    'cleaning supplies15.png',
    'cleaning supplies16.png'
  ];

  let app = null;
  let engine = null;
  let worldLayer = null;
  let textures = [];
  let pool = [];
  let active = [];
  let running = false;
  let spawnAcc = 0;
  let width = 892;
  let height = 2105;

  const mouse = {
    targetX: 0,
    targetY: -999,
    x: 0,
    y: -999,
    inside: false
  };
  let fallbackCursorEl = null;

  function ensureFallbackCursor() {
    if (fallbackCursorEl) return fallbackCursorEl;
    const el = document.createElement('div');
    el.id = 'glove-fallback-cursor';
    document.body.appendChild(el);
    fallbackCursorEl = el;
    return el;
  }

  function showFallbackCursor() {
    const el = ensureFallbackCursor();
    document.body.classList.add('glove-fallback-on');
    el.classList.add('visible');
  }

  function moveFallbackCursor(clientX, clientY) {
    if (!fallbackCursorEl) return;
    fallbackCursorEl.style.left = `${clientX}px`;
    fallbackCursorEl.style.top = `${clientY}px`;
  }

  function hideFallbackCursor() {
    document.body.classList.remove('glove-fallback-on');
    if (fallbackCursorEl) fallbackCursorEl.classList.remove('visible');
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function assetUrl(dir, file) {
    const base = String(dir || '')
      .replace(/\\/g, '/')
      .replace(/\/?$/, '/');
    const parts = base.split('/').filter(Boolean);
    return (
      parts.map(encodeURIComponent).join('/') +
      '/' +
      encodeURIComponent(file)
    );
  }

  async function listImages(dir) {
    try {
      const res = await fetch(assetUrl(dir, 'manifest.json'), {
        cache: 'no-cache'
      });
      if (!res.ok) throw new Error('no manifest');
      const list = await res.json();
      const files = (Array.isArray(list) ? list : []).filter(
        (n) => typeof n === 'string' && IMAGE_EXT.test(n)
      );
      if (files.length) return files;
    } catch (_) {
      /* fallback */
    }
    return FALLBACK_FILES.slice();
  }

  function loadTexture(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          resolve(PIXI.Texture.from(img));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error(url));
      img.src = url;
    });
  }

  async function loadAllTextures(dir, names) {
    const out = [];
    for (const name of names) {
      try {
        const tex = await loadTexture(assetUrl(dir, name));
        tex.__supplyKey = name;
        out.push(tex);
      } catch (err) {
        console.warn('[bg-animation] skip', name, err);
      }
    }
    return out;
  }

  function makeBackground(w, h) {
    const g = new PIXI.Graphics();
    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(255 + (220 - 255) * t);
      const green = Math.round(255 + (238 - 255) * t);
      const y0 = (h / steps) * i;
      g.rect(0, y0, w, h / steps + 1);
      g.fill({ color: (r << 16) | (green << 8) | 255 });
    }
    const layer = new PIXI.Container();
    layer.addChild(g);
    layer.eventMode = 'none';
    return layer;
  }

  function textureKey(tex) {
    return tex.__supplyKey || tex.uid || tex.label;
  }

  function getUsedTextureKeys() {
    const used = new Set();
    for (const item of active) {
      if (item.textureKey) used.add(item.textureKey);
    }
    return used;
  }

  /** Pick a texture not currently on screen. */
  function pickAvailableTexture() {
    const used = getUsedTextureKeys();
    const available = textures.filter((t) => !used.has(textureKey(t)));
    if (!available.length) return null;
    return pick(available);
  }

  function createItem() {
    const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    sprite.anchor.set(0.5);
    sprite.visible = false;
    sprite.eventMode = 'none';
    worldLayer.addChild(sprite);
    return { sprite, body: null, active: false, radius: 28, textureKey: null };
  }

  function acquire() {
    while (pool.length < MAX_OBJECTS + 4) pool.push(createItem());
    let item = pool.find((p) => !p.active);
    if (!item) {
      item = createItem();
      pool.push(item);
    }
    return item;
  }

  function release(item) {
    item.active = false;
    item.textureKey = null;
    item.sprite.visible = false;
    if (item.body && engine) {
      Matter.Composite.remove(engine.world, item.body);
      item.body = null;
    }
    const i = active.indexOf(item);
    if (i >= 0) active.splice(i, 1);
  }

  function overlapsOthers(x, y, radius, minGap) {
    const gap = minGap ?? SUPPLY_GAP;
    for (const item of active) {
      if (!item.body) continue;
      const dx = x - item.body.position.x;
      const dy = y - item.body.position.y;
      const minDist = radius + item.radius + gap;
      if (dx * dx + dy * dy < minDist * minDist) return true;
    }
    return false;
  }

  function pickSpawnPosition(radius, fromTop) {
    const margin = radius + 24;
    const minX = margin;
    const maxX = Math.max(margin + 1, width - margin);
    const y = fromTop ? rand(-180, -50) : rand(40, height * 0.82);

    for (let i = 0; i < 32; i++) {
      const x = rand(minX, maxX);
      if (!overlapsOthers(x, y, radius)) return { x, y };
    }

    // Fallback: try staggered vertical slots
    for (let i = 0; i < 12; i++) {
      const x = minX + ((maxX - minX) * (i + 0.5)) / 12;
      const tryY = fromTop ? rand(-180, -50) : y + i * (radius * 2 + SUPPLY_GAP);
      if (!overlapsOthers(x, tryY, radius)) return { x, y: tryY };
    }

    return { x: rand(minX, maxX), y: fromTop ? -80 : y };
  }

  function spawn(fromTop) {
    if (!textures.length || active.length >= MAX_OBJECTS) return;

    const tex = pickAvailableTexture();
    if (!tex) return;

    const item = acquire();
    const scaleMul = rand(0.75, 1.1);

    // Keep original aspect ratio — scale by longest side
    const srcW = tex.width || tex.source?.width || 64;
    const srcH = tex.height || tex.source?.height || 64;
    const longest = Math.max(srcW, srcH, 1);
    const targetLongest = 96 * scaleMul;
    const uniform = targetLongest / longest;
    const drawW = srcW * uniform;
    const drawH = srcH * uniform;
    const radius = Math.max(drawW, drawH) * 0.48;

    item.sprite.texture = tex;
    item.sprite.scale.set(uniform);
    item.sprite.alpha = 0.95;
    item.sprite.visible = true;
    item.radius = radius;
    item.textureKey = textureKey(tex);

    const pos = pickSpawnPosition(radius, fromTop);
    const x = pos.x;
    const y = pos.y;

    if (item.body && engine) {
      Matter.Composite.remove(engine.world, item.body);
    }

    item.body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0,
      friction: 0.08,
      frictionAir: 0.025,
      density: 0.001,
      slop: 0.02,
      collisionFilter: {
        group: 0,
        category: SUPPLY_CATEGORY,
        mask: SUPPLY_CATEGORY
      },
      label: 'supply'
    });

    Matter.Body.setAngle(item.body, rand(0, Math.PI * 2));
    Matter.Body.setAngularVelocity(item.body, rand(-0.02, 0.02));
    Matter.Body.setVelocity(item.body, {
      x: rand(-0.35, 0.35),
      y: rand(0.85, 1.7)
    });
    Matter.Composite.add(engine.world, item.body);

    item.active = true;
    active.push(item);
  }

  /**
   * Dodge around mouse — water around a stone.
   * Stronger sideways push, keep falling downward.
   */
  /**
   * Push apart any supplies still overlapping after physics step.
   */
  function separateSupplies() {
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const bodyA = active[i].body;
        const bodyB = active[j].body;
        if (!bodyA || !bodyB) continue;

        const dx = bodyB.position.x - bodyA.position.x;
        const dy = bodyB.position.y - bodyA.position.y;
        let dist = Math.hypot(dx, dy);
        const minDist = active[i].radius + active[j].radius + SUPPLY_GAP;

        if (dist >= minDist) continue;
        if (dist < 0.001) {
          dist = 0.001;
        }

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (minDist - dist) * 0.52;

        Matter.Body.setPosition(bodyA, {
          x: bodyA.position.x - nx * overlap,
          y: bodyA.position.y - ny * overlap
        });
        Matter.Body.setPosition(bodyB, {
          x: bodyB.position.x + nx * overlap,
          y: bodyB.position.y + ny * overlap
        });

        const push = overlap * 0.06;
        Matter.Body.setVelocity(bodyA, {
          x: bodyA.velocity.x - nx * push,
          y: bodyA.velocity.y - ny * push * 0.25
        });
        Matter.Body.setVelocity(bodyB, {
          x: bodyB.velocity.x + nx * push,
          y: bodyB.velocity.y + ny * push * 0.25
        });
      }
    }
  }

  function dodgeMouse() {
    if (!mouse.inside) return;

    const mx = mouse.x;
    const my = mouse.y;

    for (const item of active) {
      const body = item.body;
      if (!body) continue;

      let dx = body.position.x - mx;
      let dy = body.position.y - my;
      let dist = Math.hypot(dx, dy);
      const range = MOUSE_RADIUS + item.radius * 0.2;

      if (dist >= range) continue;
      if (dist < 1) {
        dx = rand(-1, 1) || 1;
        dy = 0;
        dist = 1;
      }

      const nx = dx / dist;
      const ny = dy / dist;
      const t = 1 - dist / range;
      const ease = t * t * (3 - 2 * t);

      // Prefer left/right split
      const side = Math.sign(nx) || (Math.random() < 0.5 ? -1 : 1);
      const pushX = side * (1.8 + ease * 3.2) * ease;
      const pushY = ny * ease * 0.35;

      Matter.Body.setVelocity(body, {
        x: body.velocity.x * 0.85 + pushX,
        y: Math.max(body.velocity.y * (0.92 - ease * 0.08) + pushY, 0.4)
      });

      // Soft position correction so they don't pass through cursor
      if (dist < range * 0.65) {
        const push = (range * 0.65 - dist) * 0.28;
        Matter.Body.setPosition(body, {
          x: body.position.x + nx * push,
          y: body.position.y + ny * push * 0.25
        });
      }

      Matter.Body.setAngularVelocity(
        body,
        body.angularVelocity * 0.96 + side * ease * 0.01
      );
    }
  }

  function sync() {
    for (const item of active) {
      if (!item.body) continue;
      item.sprite.x = item.body.position.x;
      item.sprite.y = item.body.position.y;
      item.sprite.rotation = item.body.angle;
    }
  }

  function recycle() {
    for (let i = active.length - 1; i >= 0; i--) {
      const item = active[i];
      if (!item.body) continue;
      const { x, y } = item.body.position;
      if (y > height + 120 || x < -120 || x > width + 120) release(item);
    }
  }

  function tick(ticker) {
    if (!running || !engine) return;

    // Smooth mouse follow
    mouse.x += (mouse.targetX - mouse.x) * 0.18;
    mouse.y += (mouse.targetY - mouse.y) * 0.18;

    dodgeMouse();
    Matter.Engine.update(engine, 1000 / 60);
    separateSupplies();

    // Gentle idle spin
    for (const item of active) {
      if (!item.body) continue;
      if (Math.abs(item.body.angularVelocity) < 0.004) {
        Matter.Body.setAngularVelocity(
          item.body,
          item.body.angularVelocity + rand(-0.001, 0.001)
        );
      }
    }

    sync();
    recycle();

    spawnAcc += ticker.deltaMS || 16;
    if (spawnAcc > 300) {
      spawnAcc = 0;
      if (active.length < MIN_OBJECTS) spawn(true);
      else if (active.length < MAX_OBJECTS && Math.random() < 0.78) spawn(true);
    }
  }

  function onMove(e, panel) {
    const rect = panel.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    mouse.inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!mouse.inside) return;

    mouse.targetX = ((e.clientX - rect.left) / rect.width) * width;
    mouse.targetY = ((e.clientY - rect.top) / rect.height) * height;
  }

  function bindMouse(panel) {
    const move = (e) => onMove(e, panel);
    const enter = () => {
      document.body.classList.add('cursor-gloves');
      showFallbackCursor();
    };
    const leave = (e) => {
      mouse.inside = false;
      document.body.classList.remove('cursor-gloves');
      hideFallbackCursor();
      if (e) moveFallbackCursor(e.clientX, e.clientY);
    };
    const moveVisual = (e) => {
      moveFallbackCursor(e.clientX, e.clientY);
    };
    panel.addEventListener('pointermove', moveVisual, { passive: true });
    panel.addEventListener('pointerenter', enter, { passive: true });
    window.addEventListener('pointermove', move, { passive: true });
    panel.addEventListener('pointerleave', leave, { passive: true });
    return () => {
      panel.removeEventListener('pointermove', moveVisual);
      panel.removeEventListener('pointerenter', enter);
      window.removeEventListener('pointermove', move);
      panel.removeEventListener('pointerleave', leave);
      document.body.classList.remove('cursor-gloves');
      hideFallbackCursor();
      if (fallbackCursorEl) {
        fallbackCursorEl.remove();
        fallbackCursorEl = null;
      }
    };
  }

  function resize(panel) {
    const rect = panel.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width) || 892);
    height = Math.max(1, Math.round(rect.height) || 900);
    if (app) app.renderer.resize(width, height);
  }

  async function init(root) {
    if (!window.PIXI || !window.Matter) {
      console.error('[bg-animation] PixiJS / Matter.js missing');
      return null;
    }

    const dir = root.dataset.imageDir || 'img/cleaning supplies/';
    const names = await listImages(dir);
    textures = await loadAllTextures(dir, names);
    if (!textures.length) {
      console.error('[bg-animation] no PNG textures loaded from', dir);
      root.innerHTML =
        '<div class="bg-anim-error">cleaning supplies 이미지를 불러오지 못했습니다.</div>';
      return null;
    }

    const panel =
      root.closest('.panel-decorative') ||
      root.closest('#animation-panel') ||
      root.parentElement ||
      root;

    app = new PIXI.Application();
    await app.init({
      width: 892,
      height: 900,
      antialias: true,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true
    });

    app.canvas.className = 'bg-anim-canvas';
    app.canvas.setAttribute('aria-hidden', 'true');
    root.appendChild(app.canvas);

    resize(panel);

    let bg = makeBackground(width, height);
    worldLayer = new PIXI.Container();
    worldLayer.eventMode = 'none';
    app.stage.eventMode = 'none';
    app.stage.addChild(bg);
    app.stage.addChild(worldLayer);

    engine = Matter.Engine.create({
      enableSleeping: false,
      gravity: { x: 0, y: 0.38 }
    });

    for (let i = 0; i < MIN_OBJECTS && active.length < textures.length; i++) {
      spawn(false);
    }

    const unbind = bindMouse(panel);
    app.ticker.maxFPS = 60;
    app.ticker.add(tick);
    running = true;

    const rebuildBg = () => {
      app.stage.removeChild(bg);
      bg.destroy({ children: true });
      bg = makeBackground(width, height);
      app.stage.addChildAt(bg, 0);
    };

    requestAnimationFrame(() => {
      resize(panel);
      rebuildBg();
    });

    const onResize = () => {
      const pw = width;
      const ph = height;
      resize(panel);
      if (width !== pw || height !== ph) rebuildBg();
    };
    window.addEventListener('resize', onResize);

    console.info(
      '[bg-animation] falling supplies ready ·',
      textures.length,
      'images ·',
      active.length,
      'objects'
    );

    return {
      destroy() {
        running = false;
        unbind();
        window.removeEventListener('resize', onResize);
        if (app) {
          app.destroy(true);
          app = null;
        }
        if (engine) {
          Matter.Engine.clear(engine);
          engine = null;
        }
        active = [];
        pool = [];
      }
    };
  }

  async function boot() {
    const root = document.getElementById('bg-anim-root');
    if (!root) return;
    try {
      window.__bgAnim = await init(root);
    } catch (err) {
      console.error('[bg-animation]', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
