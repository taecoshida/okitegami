const canvas = document.getElementById('roadCanvas');
const ctx = canvas.getContext('2d');

const speedReadout = document.getElementById('speedReadout');
const fuelReadout = document.getElementById('fuelReadout');
const distanceReadout = document.getElementById('distanceReadout');
const sceneReadout = document.getElementById('sceneReadout');
const avatarFace = document.getElementById('avatarFace');
const avatarMood = document.getElementById('avatarMood');
const driverComment = document.getElementById('driverComment');
const radioLog = document.getElementById('radioLog');
const startButton = document.getElementById('startButton');
const muteButton = document.getElementById('muteButton');
const radioButton = document.getElementById('radioButton');

const touchLeft = document.getElementById('touchLeft');
const touchRight = document.getElementById('touchRight');
const touchGas = document.getElementById('touchGas');
const touchBrake = document.getElementById('touchBrake');
const touchStop = document.getElementById('touchStop');
const touchRadio = document.getElementById('touchRadio');

const keys = new Set();
const touch = { left: false, right: false, gas: false, brake: false };

const game = {
  speed: 0,
  maxSpeed: 168,
  lateral: 0,
  distance: 0,
  fuel: 100,
  muted: false,
  audioReady: false,
  radioIndex: 0,
  eventCooldown: 0,
  lastTime: performance.now(),
};

const scenes = [
  { at: 0, name: 'CITY', sky: '#071026', road: '#151923', side: '#0d1320', glow: '#6ae3ff', signs: ['24H', 'PARK', 'HOTEL'] },
  { at: 950, name: 'NEON', sky: '#11091e', road: '#171522', side: '#130d1e', glow: '#ff4fd8', signs: ['RAMEN', 'BAR', 'GAME'] },
  { at: 1900, name: 'BRIDGE', sky: '#071727', road: '#111923', side: '#06101a', glow: '#8df7ff', signs: ['BAY', 'WIND', 'EAST'] },
  { at: 2950, name: 'TUNNEL', sky: '#030407', road: '#101016', side: '#040405', glow: '#ffd166', signs: ['LOW', 'TUNNEL', 'SLOW'] },
  { at: 3850, name: 'PORT', sky: '#08111c', road: '#121822', side: '#0a1018', glow: '#88ffb0', signs: ['PORT', 'CARGO', 'GATE'] },
];

const radioMessages = [
  'The city is quiet. The road keeps drawing itself forward.',
  'A wet reflection breaks under the headlights.',
  'Neon signs drift by like slow satellites.',
  'Bridge wind on the left. Keep the wheel soft.',
  'Static clears for three seconds, then comes back warmer.',
  'No destination set. Free driving mode remains active.',
  'The tunnel eats the engine note and gives it back lower.',
  'A convenience-store sign blinks twice in the mirror.',
];

const stopEvents = [
  'You pull over near a blue vending machine. Nothing happens. Good.',
  'A parking lot opens on the right. The asphalt is still warm.',
  'You stop under an overpass. The city becomes a ceiling.',
  'The radio catches a voice, then loses it before the sentence ends.',
  'A small shop is closed, but its sign is still awake.',
  'You idle by the bridge. The water below is only a darker road.',
];

const audio = {
  ctx: null,
  master: null,
  engine: null,
  engineGain: null,
  roadFilter: null,
  roadGain: null,
  noiseSource: null,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function currentScene() {
  const loopDistance = game.distance % 4800;
  let scene = scenes[0];
  for (const candidate of scenes) {
    if (loopDistance >= candidate.at) scene = candidate;
  }
  return scene;
}

function roadCurve(z) {
  return Math.sin((game.distance * 0.0017) + z * 3.2) * 0.32 + Math.sin((game.distance * 0.00053) + z * 8.4) * 0.16;
}

function shade(hex, amount) {
  const color = hex.replace('#', '');
  const num = parseInt(color, 16);
  const r = clamp((num >> 16) + amount, 0, 255);
  const g = clamp(((num >> 8) & 0xff) + amount, 0, 255);
  const b = clamp((num & 0xff) + amount, 0, 255);
  return `rgb(${r}, ${g}, ${b})`;
}

function polygon(points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function projectRoadPoint(z, roadCenter, horizon, w, h) {
  const perspective = Math.pow(1 - z, 2.18);
  const y = lerp(horizon, h + 80, perspective);
  const width = lerp(42, w * 1.12, perspective);
  const curve = roadCurve(z) * width * 0.28;
  const center = roadCenter + curve;
  return { y, width, center, left: center - width / 2, right: center + width / 2 };
}

function drawBackground(scene, w, h) {
  const horizon = h * 0.43;
  const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
  gradient.addColorStop(0, scene.sky);
  gradient.addColorStop(1, '#02040b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, horizon);

  ctx.fillStyle = scene.side;
  ctx.fillRect(0, horizon, w, h - horizon);

  ctx.fillStyle = 'rgba(255,255,255,0.74)';
  for (let i = 0; i < 46; i++) {
    const x = (i * 127 + Math.floor(game.distance * 0.02)) % w;
    const y = 18 + ((i * 47) % Math.floor(horizon - 42));
    ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
  }

  drawSkyline(scene, w, horizon);
}

function drawSkyline(scene, w, horizon) {
  const offset = (game.distance * 0.08) % 180;
  for (let i = -1; i < 10; i++) {
    const bw = 80 + ((i * 31) % 75);
    const bh = 70 + ((i * 53) % 130);
    const x = i * 150 - offset;
    const y = horizon - bh;
    ctx.fillStyle = 'rgba(4,8,18,0.88)';
    ctx.fillRect(x, y, bw, bh);

    ctx.fillStyle = i % 2 ? 'rgba(106,227,255,0.28)' : 'rgba(255,79,216,0.23)';
    for (let wy = y + 16; wy < horizon - 10; wy += 22) {
      for (let wx = x + 13; wx < x + bw - 12; wx += 22) {
        if ((Math.floor(wx + wy + game.distance * 0.02) % 3) !== 0) ctx.fillRect(wx, wy, 7, 3);
      }
    }
  }

  ctx.strokeStyle = scene.glow;
  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  ctx.moveTo(0, horizon + 0.5);
  ctx.lineTo(w, horizon + 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawRoad(scene, w, h) {
  const horizon = h * 0.43;
  const roadCenter = w * 0.5 - game.lateral * 120;
  const rows = 82;

  for (let i = rows; i >= 1; i--) {
    const p1 = projectRoadPoint(i / rows, roadCenter, horizon, w, h);
    const p2 = projectRoadPoint((i - 1) / rows, roadCenter, horizon, w, h);

    ctx.fillStyle = i % 2 === 0 ? scene.road : shade(scene.road, 12);
    polygon([[p1.left, p1.y], [p1.right, p1.y], [p2.right, p2.y], [p2.left, p2.y]]);

    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)';
    polygon([[p1.left - p1.width * 0.08, p1.y], [p1.left, p1.y], [p2.left, p2.y], [p2.left - p2.width * 0.08, p2.y]]);
    polygon([[p1.right, p1.y], [p1.right + p1.width * 0.08, p1.y], [p2.right + p2.width * 0.08, p2.y], [p2.right, p2.y]]);

    const stripePulse = Math.floor((game.distance * 0.24 + i * 14) / 28) % 2 === 0;
    if (stripePulse) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const sw1 = Math.max(1, p1.width * 0.012);
      const sw2 = Math.max(1, p2.width * 0.012);
      polygon([[p1.center - sw1, p1.y], [p1.center + sw1, p1.y], [p2.center + sw2, p2.y], [p2.center - sw2, p2.y]]);
    }
  }

  drawRoadsideObjects(scene, w, h, horizon, roadCenter);
}

function drawRoadsideObjects(scene, w, h, horizon, roadCenter) {
  for (let i = 0; i < 26; i++) {
    const lane = i % 2 === 0 ? -1 : 1;
    const z = (i * 0.071 + game.distance * 0.00034) % 1;
    if (z > 0.96) continue;
    const p = projectRoadPoint(z, roadCenter, horizon, w, h);
    const scale = Math.pow(1 - z, 2.25);
    const x = lane < 0 ? p.left - 45 - scale * 190 : p.right + 45 + scale * 190;
    const y = p.y;

    if (i % 3 === 0) drawStreetLight(x, y, scale, scene.glow, lane);
    if (i % 4 === 1) drawSign(x, y, scale, scene.signs[i % scene.signs.length], scene.glow);
    if (i % 5 === 2) drawBuildingBlock(x, y, scale, scene.glow);
  }
}

function drawStreetLight(x, y, scale, glow, lane) {
  const height = 24 + scale * 130;
  ctx.strokeStyle = 'rgba(210,230,255,0.42)';
  ctx.lineWidth = 1 + scale * 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - height);
  ctx.lineTo(x + lane * -18 * scale, y - height - 5 * scale);
  ctx.stroke();

  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.14 + scale * 0.24;
  ctx.beginPath();
  ctx.arc(x + lane * -18 * scale, y - height - 5 * scale, 8 + scale * 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSign(x, y, scale, text, glow) {
  const width = 24 + scale * 78;
  const height = 10 + scale * 30;
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  ctx.fillRect(x - width / 2, y - height * 2.8, width, height);
  ctx.strokeStyle = glow;
  ctx.lineWidth = Math.max(1, scale * 2);
  ctx.strokeRect(x - width / 2, y - height * 2.8, width, height);
  ctx.fillStyle = glow;
  ctx.font = `${Math.max(7, 8 + scale * 12)}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y - height * 1.95);
}

function drawBuildingBlock(x, y, scale, glow) {
  const width = 20 + scale * 80;
  const height = 28 + scale * 150;
  ctx.fillStyle = 'rgba(4,7,14,0.84)';
  ctx.fillRect(x - width / 2, y - height, width, height);
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(x - width / 2 + width * 0.2, y - height + height * 0.2, width * 0.15, height * 0.55);
  ctx.fillRect(x - width / 2 + width * 0.6, y - height + height * 0.1, width * 0.18, height * 0.72);
  ctx.globalAlpha = 1;
}

function drawCar(w, h) {
  const x = w * 0.5 + game.lateral * 170;
  const y = h * 0.82;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(game.lateral * 0.04);

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 70, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createLinearGradient(0, -44, 0, 34);
  body.addColorStop(0, '#dffaff');
  body.addColorStop(0.42, '#5be8ff');
  body.addColorStop(1, '#112437');
  ctx.fillStyle = body;
  roundedRect(-48, -38, 96, 72, 18);
  ctx.fill();

  ctx.fillStyle = 'rgba(4,8,18,0.8)';
  roundedRect(-27, -29, 54, 30, 10);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(-41, 12, 20, 8);
  ctx.fillRect(21, 12, 20, 8);

  ctx.strokeStyle = 'rgba(255,79,216,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-35, 36);
  ctx.lineTo(35, 36);
  ctx.stroke();
  ctx.restore();
}

function drawOverlay(scene, w, h) {
  const vignette = ctx.createRadialGradient(w / 2, h * 0.55, 100, w / 2, h * 0.55, w * 0.72);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.56)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = scene.glow;
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.45);
    ctx.lineTo((i / 17) * w, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function update(dt) {
  const accelerating = keys.has('w') || keys.has('arrowup') || touch.gas;
  const braking = keys.has('s') || keys.has('arrowdown') || touch.brake;
  const left = keys.has('a') || keys.has('arrowleft') || touch.left;
  const right = keys.has('d') || keys.has('arrowright') || touch.right;

  if (accelerating && game.fuel > 0) game.speed += 82 * dt;
  else game.speed -= 28 * dt;
  if (braking) game.speed -= 105 * dt;
  game.speed = clamp(game.speed, 0, game.maxSpeed);

  const steerStrength = 1.45 * dt * (0.28 + game.speed / game.maxSpeed);
  if (left) game.lateral -= steerStrength;
  if (right) game.lateral += steerStrength;
  if (!left && !right) game.lateral *= Math.pow(0.92, dt * 60);
  game.lateral = clamp(game.lateral, -1.25, 1.25);

  game.distance += game.speed * dt * 3.15;
  if (game.speed > 3) game.fuel = clamp(game.fuel - game.speed * dt * 0.0026, 0, 100);
  if (game.eventCooldown > 0) game.eventCooldown -= dt;

  updateAudio();
  updateHud();
}

function render() {
  const w = canvas.width;
  const h = canvas.height;
  const scene = currentScene();
  drawBackground(scene, w, h);
  drawRoad(scene, w, h);
  drawCar(w, h);
  drawOverlay(scene, w, h);
}

function updateHud() {
  const scene = currentScene();
  speedReadout.textContent = Math.round(game.speed).toString();
  fuelReadout.textContent = Math.round(game.fuel).toString();
  distanceReadout.textContent = (game.distance / 1000).toFixed(1);
  sceneReadout.textContent = scene.name;

  if (game.fuel <= 0) {
    avatarFace.textContent = '😵';
    avatarMood.textContent = 'empty';
    driverComment.textContent = 'Fuel is gone. The night has become a parking lot.';
  } else if (game.speed > 120) {
    avatarFace.textContent = '😎';
    avatarMood.textContent = 'fast';
    driverComment.textContent = 'The road is turning into a ribbon.';
  } else if (game.speed > 45) {
    avatarFace.textContent = '🙂';
    avatarMood.textContent = 'cruising';
    driverComment.textContent = 'Good speed. Soft hands. Keep flowing.';
  } else if (game.speed > 0) {
    avatarFace.textContent = '😐';
    avatarMood.textContent = 'rolling';
    driverComment.textContent = 'Low speed. The city has edges again.';
  } else {
    avatarFace.textContent = '🌙';
    avatarMood.textContent = 'idle';
    driverComment.textContent = 'Stopped. Engine hums under the dashboard.';
  }
}

function loop(now) {
  const dt = Math.min(0.05, (now - game.lastTime) / 1000);
  game.lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function initAudio() {
  if (game.audioReady) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    radioLog.textContent = '[audio] Web Audio API is not available in this browser.';
    return;
  }

  audio.ctx = new AudioContext();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = 0.65;
  audio.master.connect(audio.ctx.destination);

  audio.engine = audio.ctx.createOscillator();
  audio.engine.type = 'sawtooth';
  audio.engine.frequency.value = 48;
  audio.engineGain = audio.ctx.createGain();
  audio.engineGain.gain.value = 0.0001;
  audio.engine.connect(audio.engineGain);
  audio.engineGain.connect(audio.master);
  audio.engine.start();

  const buffer = makeNoiseBuffer(audio.ctx, 2);
  audio.noiseSource = audio.ctx.createBufferSource();
  audio.noiseSource.buffer = buffer;
  audio.noiseSource.loop = true;
  audio.roadFilter = audio.ctx.createBiquadFilter();
  audio.roadFilter.type = 'bandpass';
  audio.roadFilter.frequency.value = 520;
  audio.roadFilter.Q.value = 0.7;
  audio.roadGain = audio.ctx.createGain();
  audio.roadGain.gain.value = 0.0001;
  audio.noiseSource.connect(audio.roadFilter);
  audio.roadFilter.connect(audio.roadGain);
  audio.roadGain.connect(audio.master);
  audio.noiseSource.start();

  game.audioReady = true;
  radioLog.textContent = '[engine] audio context online. W / ↑ or GAS to accelerate.';
}

function makeNoiseBuffer(audioContext, seconds) {
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, sampleRate * seconds, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function updateAudio() {
  if (!game.audioReady || !audio.ctx) return;
  const t = audio.ctx.currentTime;
  const muted = game.muted ? 0 : 1;
  const speedRatio = game.speed / game.maxSpeed;

  audio.engine.frequency.linearRampToValueAtTime(42 + speedRatio * 155 + Math.abs(game.lateral) * 12, t + 0.05);
  audio.engineGain.gain.linearRampToValueAtTime((0.018 + speedRatio * 0.06) * muted, t + 0.05);
  audio.roadFilter.frequency.linearRampToValueAtTime(330 + speedRatio * 1850, t + 0.05);
  audio.roadGain.gain.linearRampToValueAtTime((0.002 + speedRatio * 0.085) * muted, t + 0.05);
}

function blip(type = 'ui') {
  if (!game.audioReady || game.muted || !audio.ctx) return;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  const now = audio.ctx.currentTime;

  osc.type = type === 'radio' ? 'square' : 'sine';
  osc.frequency.value = type === 'stop' ? 180 : type === 'radio' ? 880 : 520;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(type === 'radio' ? 0.07 : 0.05, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'stop' ? 0.35 : 0.13));

  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(now);
  osc.stop(now + 0.42);
  if (type === 'radio') radioStaticBurst();
}

function radioStaticBurst() {
  if (!game.audioReady || game.muted || !audio.ctx) return;
  const source = audio.ctx.createBufferSource();
  source.buffer = makeNoiseBuffer(audio.ctx, 0.28);
  const filter = audio.ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1600;
  const gain = audio.ctx.createGain();
  const now = audio.ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  source.start(now);
  source.stop(now + 0.3);
}

function triggerRadio() {
  const message = radioMessages[game.radioIndex % radioMessages.length];
  game.radioIndex += 1;
  radioLog.textContent = `[radio] ${message}`;
  blip('radio');
}

function triggerStopEvent() {
  if (game.eventCooldown > 0) return;
  game.speed *= 0.28;
  const event = stopEvents[Math.floor((game.distance / 400 + game.radioIndex) % stopEvents.length)];
  radioLog.textContent = `[stop] ${event}`;
  game.eventCooldown = 1.2;
  blip('stop');
}

async function startEngine() {
  initAudio();
  if (audio.ctx && audio.ctx.state === 'suspended') await audio.ctx.resume();
  startButton.textContent = 'ENGINE ON';
  blip('ui');
}

function toggleMute() {
  game.muted = !game.muted;
  muteButton.textContent = game.muted ? 'UNMUTE' : 'MUTE';
  radioLog.textContent = game.muted ? '[audio] muted.' : '[audio] unmuted.';
}

function bindHoldButton(button, flag) {
  if (!button) return;
  const press = async (event) => {
    event.preventDefault();
    if (!game.audioReady && flag === 'gas') await startEngine();
    touch[flag] = true;
    button.classList.add('is-pressed');
  };
  const release = (event) => {
    if (event) event.preventDefault();
    touch[flag] = false;
    button.classList.remove('is-pressed');
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
  button.addEventListener('contextmenu', (event) => event.preventDefault());
}

startButton.addEventListener('click', startEngine);
muteButton.addEventListener('click', toggleMute);
radioButton.addEventListener('click', triggerRadio);
touchStop?.addEventListener('click', triggerStopEvent);
touchRadio?.addEventListener('click', triggerRadio);

bindHoldButton(touchLeft, 'left');
bindHoldButton(touchRight, 'right');
bindHoldButton(touchGas, 'gas');
bindHoldButton(touchBrake, 'brake');

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(key)) event.preventDefault();
  if (key === ' ') triggerStopEvent();
  else if (key === 'r') triggerRadio();
  else if (key === 'm') toggleMute();
  else keys.add(key);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

function resizeCanvasForDisplay() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

window.addEventListener('resize', resizeCanvasForDisplay);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvasForDisplay, 250));
resizeCanvasForDisplay();
requestAnimationFrame(loop);
