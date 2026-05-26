//  APPLICATION STAGE

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// pastel color options for bubbles
const COLORS = [
{ fill: "#ffd6e7", stroke: "#f4a0c0" },
{ fill: "#c9e4ff", stroke: "#7ab8f5" },
{ fill: "#e2d4f7", stroke: "#b48de0" },
{ fill: "#c8f5e4", stroke: "#6dcfaa" },
{ fill: "#fff3b0", stroke: "#f5c842" },
{ fill: "#ffd8c0", stroke: "#f5945a" },
];

// decorative star dots in the background
const STARS = [];
for (let i = 0; i < 18; i++) {
STARS.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2.5 + 1,
    alpha: Math.random() * 0.4 + 0.1,
});
}

// game state variables
let bubbles   = [];
let popEffects = [];
let score     = 0;
let missed    = 0;
let level     = 1;
let baseSpeed = 0.55;

// Bubble factory function- Defines all properties of one bubble

function createBubble() {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const r = Math.random() * 22 + 14;
return {
    x: r + Math.random() * (canvas.width - r * 2),
    y: canvas.height + r,
    r: r,
    vy: -(baseSpeed + Math.random() * 0.6),
    vx: (Math.random() - 0.5) * 0.4,
    fill: color.fill,
    stroke: color.stroke,
    alpha: 0.88,
};
}

// spawn the starting set of bubbles
for (let i = 0; i < 4; i++) {
let b = createBubble();
  b.y = Math.random() * canvas.height;
bubbles.push(b);
}

//  GEOMETRY STAGE

function updateBubbles() {

  // move each bubble upward and sideways each frame
for (let b of bubbles) {
    b.x += b.vx;
    b.y += b.vy;

    //reverse horizontal direction if bubble hits the canvas walls
    if (b.x - b.r < 0 || b.x + b.r > canvas.width) {
      b.vx *= -1;
    }
}

  // check which bubbles have floated off the top (missed ones)
const before = bubbles.length;
bubbles = bubbles.filter(b => b.y + b.r > 0);
const escaped = before - bubbles.length;
if (escaped > 0) {
missed += escaped;
document.getElementById("missedVal").textContent = missed;
}

  // keep bubble count at 4
while (bubbles.length < 4) {
    bubbles.push(createBubble());
}
}


// update sparkle particles after a bubble is popped
function updatePopEffects() {
for (let ef of popEffects) {
    for (let p of ef.particles) {
      p.x += p.vx;       // particle moves outward
      p.y += p.vy;       // particle moves outward
      p.vy += 0.1;       // gravity pulls particles downward
      p.alpha -= 0.045;  // fade out over time
    }
    // Remove particles that have fully faded
    ef.particles = ef.particles.filter(p => p.alpha > 0);
}
  // Remove effects with no particles left
popEffects = popEffects.filter(ef => ef.particles.length > 0);
}


// level up every 10 points and increase speed slightly
function checkLevel() {
const newLevel = Math.floor(score / 10) + 1;
if (newLevel !== level) {
    level = newLevel;
    baseSpeed = 0.55 + (level - 1) * 0.25;
    document.getElementById("levelVal").textContent = level;

    //update velocity of all existing bubbles to match new speed
    for (let b of bubbles) {
      b.vy = -(baseSpeed + Math.random() * 0.6);
    }
}
}

//  RASTERIZATION STAGE

function drawStars() {
for (let s of STARS) {
    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = "#c8a8e8";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
}

// draw one bubble using layered shapes
function drawBubble(b) {
ctx.save();
ctx.globalAlpha = b.alpha;

  //bubble body-filled circle (layer 1)
ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
ctx.fillStyle = b.fill;
ctx.fill();

  // bubble border ring- stroked circle on top (layer 2)
ctx.strokeStyle = b.stroke;
ctx.lineWidth = 2;
ctx.stroke();

  // RASTERIZATION: inner ring — semi-transparent circle for glass depth (layer 3)
  // Demonstrates TRANSPARENCY: rgba with alpha < 1
ctx.beginPath();
  ctx.arc(b.x, b.y, b.r * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)"; // semi-transparent white
ctx.lineWidth = 1;
  ctx.stroke();                              // RASTERIZATION: transparent layer

  // RASTERIZATION: shine highlight — small white ellipse top-left (layer 4)
  // Demonstrates LAYERING: drawn last so it appears on top of everything
  const shineX = b.x - b.r * 0.3;
  const shineY = b.y - b.r * 0.35;
ctx.beginPath();
  ctx.ellipse(shineX, shineY, b.r * 0.22, b.r * 0.13, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";  // semi-transparent shine
  ctx.fill();                                    // RASTERIZATION: shine pixels

ctx.restore();
}


// RASTERIZATION: draw sparkle particles after popping a bubble
function drawPopEffects() {
for (let ef of popEffects) {
    for (let p of ef.particles) {
    ctx.save();
      ctx.globalAlpha = p.alpha;              // RASTERIZATION: fading transparency
    ctx.fillStyle = p.color;
    ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); // RASTERIZATION: small dot
    ctx.fill();
    ctx.restore();
    }
}
}


// RASTERIZATION: repaint the entire canvas each frame (in layer order)
function drawScene() {

  // RASTERIZATION: clear all pixels from last frame
ctx.clearRect(0, 0, canvas.width, canvas.height);

  // RASTERIZATION: soft background fill (layer 0 — bottom-most)
ctx.fillStyle = "#faf5ff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

  // RASTERIZATION: decorative stars (layer 1)
drawStars();

  // RASTERIZATION: bubbles — each one drawn with 4 layered shapes (layer 2)
for (let b of bubbles) {
    drawBubble(b);
}

  // RASTERIZATION: pop sparkles on top of everything (layer 3 — top-most)
drawPopEffects();
}

//  MAIN GAME LOOP- Each frame goes: Application logic → Geometry update → Rasterize.

function gameLoop() {

  // APPLICATION STAGE: update game logic
updateBubbles();
updatePopEffects();
checkLevel();

  // GEOMETRY + RASTERIZATION: draw the updated state to the canvas
drawScene();

  // Schedule the next frame
requestAnimationFrame(gameLoop);
}


//  APPLICATION STAGE: user input is to click to pop bubbles

canvas.addEventListener("click", function (e) {

  // convert browser window coordinates to canvas coordinates
const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
  const my = (e.clientY - rect.top)  * (canvas.height / rect.height);

  //loop bubbles from front to back (last drawn = topmost)
for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];

    //distance from click point to bubble centre
    const dx   = mx - b.x;
    const dy   = my - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= b.r) {
      //bubble was hit, create sparkle particles
    const particles = [];
    for (let j = 0; j < 10; j++) {
        const angle = (Math.PI * 2 / 10) * j;
        particles.push({
        x:     b.x,
        y:     b.y,
          vx:    Math.cos(angle) * (1.2 + Math.random() * 1.8),
          vy:    Math.sin(angle) * (1.2 + Math.random() * 1.8),
          r:     Math.random() * 3 + 2,
        alpha: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)].stroke,
        });
    }
    popEffects.push({ particles });

      // remove bubble, update score display
    bubbles.splice(i, 1);
    score++;
    document.getElementById("scoreVal").textContent = score;
    break;
    }
}
});


//restart button resets all game state
document.getElementById("restartBtn").addEventListener("click", function () {
score     = 0;
missed    = 0;
level     = 1;
baseSpeed = 0.55;
bubbles   = [];
popEffects = [];

document.getElementById("scoreVal").textContent  = 0;
document.getElementById("missedVal").textContent = 0;
document.getElementById("levelVal").textContent  = 1;

  // respawn 4 bubbles scattered across the canvas
for (let i = 0; i < 4; i++) {
    let b = createBubble();
    b.y = Math.random() * canvas.height;
    bubbles.push(b);
}
});


// Kick off the game loop
gameLoop();