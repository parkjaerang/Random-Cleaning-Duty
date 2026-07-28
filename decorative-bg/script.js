/**
 * Decorative cleaning-supplies background
 * PixiJS v8 (render) + Matter.js (physics)
 * Soft “water around a stone” mouse flow
 */
(function () {
  'use strict';

  const DESIGN_W = 892;
  const DESIGN_H = 2105;
  const MOUSE_RADIUS = 140;
  const TARGET_VISIBLE = { min: 15, max: 25 };
  const IMAGE_EXT = /\.(png|webp|svg)$/i;

  const CFG = {
    gravityY: 0.00022,
    frictionAir: 0.045,
    restitution: 0.02,
    density: 0.0008,
    baseSize: 72,
    scaleMin: 0.75,
    scaleMax: 1.1,
    fallSpeedMin: 0.35,
    fallSpeedMax: 0.85,
    angularDamp: 0.04,
    mouseLerp: 0.12,
    softPush: 0.000035,
    softSlowY: 0.94,
    softSlowX: 0.97,
    spawnMargin: 80,
    recyclePad: 120
  };

  /** @type {PIXI.Application|null} */
  let app = null;
  /** @type {Matter.Engine|null} */
  let engine = null;
  /** @type {Matter.Body|null} */
  let mouseBody = null;
  /** @type {PIXI.Container|null} */
  let worldLayer = null;
  /** @type {PIXI.Texture[]} */
  let textures = [];
  /** @type {Array} */
  let pool = [];
  /** @type {Array} */
  let active = [];

  let mouseTarget = { x: DESIGN_W / 2, y: -400 };
  let mouseSmooth = { x: DESIGN_W / 2, y: -400 };
  let mouseInside = false;
  let running = false;
  let spawnAcc = 0;
  let width = DESIGN_W;
  let height = DESIGN_H;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Dynamically discover image files from the supplies folder.
   * Uses manifest.json so filenames are not hardcoded in spawn logic.
   */
  async function loadImageManifest(imageDir) {
    const res = await fetch(`${imageDir}manifest.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load cleaning supplies manifest');
    const list = await res.json();
    if (!Array.isArray(list)) throw new Error('Invalid manifest format');
    return list.filter((name) => typeof name === 'string' && IMAGE_EXT.test(name));
  }

  async function loadTextures(imageDir, names) {
    const loaded = [];
    for (const name of names) {
      try {
        const url = encodeURI(`${imageDir}${name}`);
        const texture = await PIXI.Assets.load(url);
        if (texture) loaded.push(texture);
      } catch (err) {
        console.warn('[bg-animation] skip image', name, err);
      }
    }
    return loaded;
  }

  function createGradientBackground(w, h) {
    const g = new PIXI.Graphics();
    const steps = 48;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(255 + (220 - 255) * t);
      const green = Math.round(255 + (238 - 255) * t);
      const b = Math.round(255 + (255 - 255) * t);
      const y0 = (h / steps) * i;
      const y1 = (h / steps) * (i + 1) + 1;
      g.rect(0, y0, w, y1 - y0);
      g.fill({ color: (r << 16) | (green << 8) | b });
    }

    // Soft blue ambient glow near bottom
    const glow = new PIXI.Graphics();
    glow.ellipse(w * 0.5, h * 0.78, w * 0.55, h * 0.28);
    glow.fill({ color: 0xb8d9ff, alpha: 0.22 });
    glow.ellipse(w * 0.3, h * 0.35, w * 0.35, h * 0.18);
    glow.fill({ color: 0xe8f4ff, alpha: 0.18 });

    const layer = new PIXI.Container();
    layer.addChild(g);
    layer.addChild(glow);
    layer.eventMode = 'none';
    return layer;
  }

  function createPoolItem() {
    const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    sprite.anchor.set(0.5);
    sprite.visible = false;
    sprite.eventMode = 'none';
    worldLayer.addChild(sprite);

    return {
      sprite,
      body: null,
      active: false,
      baseRadius: 24
    };
  }

  function ensurePool(n) {
    while (pool.length < n) {
      pool.push(createPoolItem());
    }
  }

  function acquire() {
    ensurePool(TARGET_VISIBLE.max + 4);
    let item = pool.find((p) => !p.active);
    if (!item) {
      item = createPoolItem();
      pool.push(item);
    }
    return item;
  }

  function detachBody(item) {
    if (item.body && engine) {
      Matter.Composite.remove(engine.world, item.body);
      item.body = null;
    }
  }

  function release(item) {
    item.active = false;
    item.sprite.visible = false;
    detachBody(item);
    const idx = active.indexOf(item);
    if (idx >= 0) active.splice(idx, 1);
  }

  function spawnOne(fromTop) {
    if (!textures.length) return;
    if (active.length >= TARGET_VISIBLE.max) return;

    const item = acquire();
    const texture = pick(textures);
    const scale = rand(CFG.scaleMin, CFG.scaleMax);
    const size = CFG.baseSize * scale;
    const radius = size * 0.38;

    item.sprite.texture = texture;
    item.sprite.width = size;
    item.sprite.height = size;
    item.sprite.alpha = 0.92;
    item.sprite.visible = true;
    item.baseRadius = radius;

    const x = rand(CFG.spawnMargin, width - CFG.spawnMargin);
    const y = fromTop
      ? rand(-CFG.recyclePad - 80, -40)
      : rand(-40, height * 0.85);

    detachBody(item);
    item.body = Matter.Bodies.circle(x, y, radius, {
      restitution: CFG.restitution,
      friction: 0.002,
      frictionAir: CFG.frictionAir + rand(0, 0.02),
      density: CFG.density,
      collisionFilter: { group: 0, category: 0x0002, mask: 0 }, // soft forces only
      label: 'supply'
    });

    Matter.Body.setAngle(item.body, rand(0, Math.PI * 2));
    Matter.Body.setAngularVelocity(item.body, rand(-0.012, 0.012));
    Matter.Body.setVelocity(item.body, {
      x: rand(-0.15, 0.15),
      y: rand(CFG.fallSpeedMin, CFG.fallSpeedMax)
    });
    Matter.Composite.add(engine.world, item.body);

    item.active = true;
    active.push(item);
  }

  function seedInitial() {
    const count = Math.floor(rand(TARGET_VISIBLE.min, TARGET_VISIBLE.max + 1));
    for (let i = 0; i < count; i++) spawnOne(false);
  }

  /**
   * Soft stone-in-water forces: slow + lateral split, no violent bounce.
   * Stronger near the core so objects cannot pass through the cursor.
   */
  function applyMouseFlow() {
    if (!mouseInside) return;

    const mx = mouseSmooth.x;
    const my = mouseSmooth.y;

    for (const item of active) {
      const body = item.body;
      if (!body) continue;

      const dx = body.position.x - mx;
      const dy = body.position.y - my;
      const dist = Math.hypot(dx, dy);
      const influence = MOUSE_RADIUS + item.baseRadius;

      if (dist >= influence || dist < 0.0001) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      const t = 1 - dist / influence;
      const ease = t * t * (3 - 2 * t); // smoothstep

      // Core barrier — keeps objects from tunneling through the cursor
      const core = Math.max(0, influence * 0.42 - dist);
      const barrier = core * 0.00008;

      // Prefer horizontal split (flow around stone)
      const pushX =
        nx * (CFG.softPush * ease * (1.4 + Math.abs(ny) * 0.45) + barrier);
      const pushY = ny * (CFG.softPush * ease * 0.32 + barrier * 0.25);

      Matter.Body.applyForce(body, body.position, { x: pushX, y: pushY });

      // Gently slow near cursor; preserve downward drift
      Matter.Body.setVelocity(body, {
        x: body.velocity.x * (CFG.softSlowX - ease * 0.05),
        y: Math.max(
          body.velocity.y * (CFG.softSlowY - ease * 0.05),
          CFG.fallSpeedMin * 0.2
        )
      });

      Matter.Body.setAngularVelocity(
        body,
        body.angularVelocity * (1 - CFG.angularDamp * ease)
      );
    }
  }

  function syncSprites() {
    for (const item of active) {
      const { sprite, body } = item;
      if (!body) continue;
      sprite.x = body.position.x;
      sprite.y = body.position.y;
      sprite.rotation = body.angle;
    }
  }

  function recycleOffscreen() {
    for (let i = active.length - 1; i >= 0; i--) {
      const item = active[i];
      const y = item.body.position.y;
      const x = item.body.position.x;
      if (
        y > height + CFG.recyclePad ||
        x < -CFG.recyclePad ||
        x > width + CFG.recyclePad
      ) {
        release(item);
      }
    }
  }

  function tick(ticker) {
    if (!running || !engine) return;

    // Smooth mouse follow
    mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * CFG.mouseLerp;
    mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * CFG.mouseLerp;

    if (mouseBody) {
      Matter.Body.setPosition(mouseBody, {
        x: mouseSmooth.x,
        y: mouseInside ? mouseSmooth.y : -800
      });
    }

    applyMouseFlow();
    Matter.Engine.update(engine, 1000 / 60);

    // Soft angular damping / idle drift
    for (const item of active) {
      if (!item.body) continue;
      const av = item.body.angularVelocity;
      if (Math.abs(av) < 0.002) {
        Matter.Body.setAngularVelocity(item.body, av + rand(-0.0008, 0.0008));
      } else {
        Matter.Body.setAngularVelocity(item.body, av * (1 - CFG.angularDamp * 0.15));
      }
    }

    syncSprites();
    recycleOffscreen();

    // Maintain sparse population
    spawnAcc += ticker.deltaMS;
    if (spawnAcc > 700) {
      spawnAcc = 0;
      if (active.length < TARGET_VISIBLE.min) spawnOne(true);
      else if (active.length < TARGET_VISIBLE.max && Math.random() < 0.45) {
        spawnOne(true);
      }
    }
  }

  function onPointerMove(e, root) {
    const rect = root.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (width / rect.width);
    const sy = (e.clientY - rect.top) * (height / rect.height);
    mouseTarget.x = sx;
    mouseTarget.y = sy;
    mouseInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
  }

  function bindPointer(root) {
    // Track mouse over the panel; canvas itself stays pointer-events: none
    const move = (e) => onPointerMove(e, root);
    const leave = () => {
      mouseInside = false;
    };
    window.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', leave, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
    };
  }

  function resizeToPanel(root) {
    const rect = root.getBoundingClientRect();
    // Prefer panel size; fall back to design size
    width = Math.max(1, Math.round(rect.width) || DESIGN_W);
    height = Math.max(1, Math.round(rect.height) || DESIGN_H);

    if (app) {
      app.renderer.resize(width, height);
    }
  }

  async function init(root) {
    if (!root || !window.PIXI || !window.Matter) {
      console.error('[bg-animation] PixiJS or Matter.js missing');
      return null;
    }

    const imageDir =
      root.dataset.imageDir || 'img/cleaning supplies/';
    const names = await loadImageManifest(imageDir);
    textures = await loadTextures(imageDir, names);
    if (!textures.length) {
      console.error('[bg-animation] no textures loaded');
      return null;
    }

    app = new PIXI.Application();
    await app.init({
      width: DESIGN_W,
      height: DESIGN_H,
      antialias: true,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgl'
    });

    app.canvas.className = 'bg-anim-canvas';
    app.canvas.setAttribute('aria-hidden', 'true');
    root.appendChild(app.canvas);

    resizeToPanel(root);

    let bgLayer = createGradientBackground(width, height);
    worldLayer = new PIXI.Container();
    worldLayer.eventMode = 'none';
    app.stage.addChild(bgLayer);
    app.stage.addChild(worldLayer);
    app.stage.eventMode = 'none';

    engine = Matter.Engine.create({
      enableSleeping: false,
      gravity: { x: 0, y: CFG.gravityY, scale: 1 }
    });

    // Invisible mouse collider — sensor only; soft forces do the split
    mouseBody = Matter.Bodies.circle(-999, -999, MOUSE_RADIUS, {
      isStatic: true,
      isSensor: true,
      restitution: 0,
      friction: 0,
      collisionFilter: { category: 0x0001, mask: 0 },
      label: 'mouse-stone'
    });
    Matter.Composite.add(engine.world, mouseBody);

    ensurePool(TARGET_VISIBLE.max + 6);
    seedInitial();

    const unbind = bindPointer(root);
    app.ticker.maxFPS = 60;
    app.ticker.add(tick);
    running = true;

    const onResize = () => {
      const prevW = width;
      const prevH = height;
      resizeToPanel(root);
      if (width !== prevW || height !== prevH) {
        app.stage.removeChild(bgLayer);
        bgLayer.destroy({ children: true });
        bgLayer = createGradientBackground(width, height);
        app.stage.addChildAt(bgLayer, 0);
      }
    };
    window.addEventListener('resize', onResize);

    return {
      destroy() {
        running = false;
        unbind();
        window.removeEventListener('resize', onResize);
        if (app) {
          app.destroy(true, { children: true, texture: false });
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
