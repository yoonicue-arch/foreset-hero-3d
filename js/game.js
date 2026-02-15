/**
 * Forest Hero 3D - Main Game Logic
 * Using Three.js (WebGL)
 */

console.log("📝 Game script loaded");

// --- Sound System ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
console.log("🔊 Audio context created");
function playSound(type) {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    switch(type) {
        case 'jump': osc.type = 'square'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1); gain.gain.setValueAtTime(0.05, now); osc.start(); osc.stop(now + 0.1); break;
        case 'attack': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1); gain.gain.setValueAtTime(0.05, now); osc.start(); osc.stop(now + 0.1); break;
        case 'hit': osc.type = 'sine'; osc.frequency.setValueAtTime(100, now); gain.gain.setValueAtTime(0.1, now); osc.start(); osc.stop(now + 0.05); break;
        case 'levelup': [440, 554, 659].forEach((f, i) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.connect(g); g.connect(audioCtx.destination); o.frequency.setValueAtTime(f, now + i*0.1); g.gain.setValueAtTime(0.05, now + i*0.1); o.start(now + i*0.1); o.stop(now + i*0.1 + 0.1); }); break;
        case 'spawn': osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1); gain.gain.setValueAtTime(0.05, now); osc.start(); osc.stop(now + 0.1); break;
    }
}

// --- 3D Scene Setup ---
let scene, camera, renderer, clock, raycaster;
let playerGroup, swordMesh, shieldMesh;
let trees = [], enemies = [], items = [], projectiles = [], groundMeshes = [], groundShapes = [];
let gameActive = false;
let stage = 1;
let stageTime = 120; // 2 minutes
let money = 0;
let totalEnemiesInStage = 10;
let enemiesDefeated = 0;
const keys = {};

const PLAYER_DATA = {
    x: 0, y: 0, z: 0,
    hp: 100, maxHp: 100, lv: 1, xp: 0, nextXp: 5,
    speed: 0.15, jumpV: 0, isJumping: false,
    isAttacking: false, attackTimer: 0, chargeTime: 0,
    weapon: 'sword', direction: 1, shieldTimer: 0,
    isFalling: false
};

const WORLD_SIZE = 180; // Total world size 180×180
const TILE_SIZE = 60; // Each tile 60×60
const GRID_SIZE = 3; // 3×3 grid
const NUM_TILES = 8; // 8 consonant tiles (excluding center)
let consonantWorlds = []; // Store world info

function initGame() {
    console.log("🎮 initGame() called");
    document.getElementById('start-screen').style.display = 'none';
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    camera = new THREE.PerspectiveCamera(75, 1024 / 768, 0.1, 2000);
    camera.position.set(0, 50, 80);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1024, 768);
    renderer.shadowMap.enabled = true;
    raycaster = new THREE.Raycaster();
    const container = document.getElementById('game-container');
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) existingCanvas.remove();
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(10, 15, 10);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.left = -100;
    light.shadow.camera.right = 100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 200;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x808080));
    
    createPlayer();
    // Player spawn at (1,1) center
    playerGroup.position.set(0, 0, 0);
    initConsonantWorlds();
    
    clock = new THREE.Clock();
    gameActive = true;
    animate();
    
    window.addEventListener('keydown', e => { 
        keys[e.code] = true; 
        if(["ArrowUp","ArrowDown","Space"].includes(e.code)) e.preventDefault(); 
    });
    window.addEventListener('keyup', e => keys[e.code] = false);
}

function createPlayer() {
    playerGroup = new THREE.Group();
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.5), new THREE.MeshPhongMaterial({ color: 0x1e90ff }));
    body.position.y = 0.5;
    body.castShadow = true;
    playerGroup.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshPhongMaterial({ color: 0xffdbac }));
    head.position.y = 1.3;
    playerGroup.add(head);

    // Eyes on all sides
    // Front eyes
    const eyeFL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeFL.position.set(0.15, 1.4, 0.3);
    playerGroup.add(eyeFL);
    const eyeFR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeFR.position.set(-0.15, 1.4, 0.3);
    playerGroup.add(eyeFR);
    
    // Back eyes
    const eyeBL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeBL.position.set(0.15, 1.4, -0.3);
    playerGroup.add(eyeBL);
    const eyeBR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeBR.position.set(-0.15, 1.4, -0.3);
    playerGroup.add(eyeBR);
    
    // Left eyes
    const eyeLTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeLTop.position.set(-0.3, 1.4, 0.15);
    playerGroup.add(eyeLTop);
    const eyeLBot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeLBot.position.set(-0.3, 1.4, -0.15);
    playerGroup.add(eyeLBot);
    
    // Right eyes
    const eyeRTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeRTop.position.set(0.3, 1.4, 0.15);
    playerGroup.add(eyeRTop);
    const eyeRBot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeRBot.position.set(0.3, 1.4, -0.15);
    playerGroup.add(eyeRBot);

    const swordGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
    const swordMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
    swordMesh = new THREE.Mesh(swordGeo, swordMat);
    swordMesh.position.set(0.6, 0.8, 0);
    playerGroup.add(swordMesh);

    shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 }));
    shieldMesh.visible = false;
    playerGroup.add(shieldMesh);

    scene.add(playerGroup);
}

function initConsonantWorlds() {
    const tileSize = TILE_SIZE; // 60
    const englishChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    // Define all 9 positions (0,0) to (2,2)
    const positions = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            positions.push({ row, col });
        }
    }
    
    // Separate center (1,1) from others
    const centerPos = positions.find(p => p.row === 1 && p.col === 1);
    const otherPositions = positions.filter(p => !(p.row === 1 && p.col === 1));
    
    // Shuffle and select 8 random positions for consonant tiles
    for (let i = otherPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherPositions[i], otherPositions[j]] = [otherPositions[j], otherPositions[i]];
    }
    const consonantPositions = otherPositions.slice(0, NUM_TILES);
    
    // Create consonant tiles based on character grid
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x44aa44 });
    for (let i = 0; i < consonantPositions.length; i++) {
        const pos = consonantPositions[i];
        const randomChar = englishChars[Math.floor(Math.random() * englishChars.length)];
        const worldX = (pos.col - 1) * 58;
        const worldZ = (pos.row - 1) * 58;
        
        // Generate character grid (15x15)
        const charGrid = generateCharGrid('Dotum', 15, randomChar);
        
        // Create ground shape from grid
        const groundShape = createGroundShapeFromGrid(charGrid, groundMat);
        groundShape.position.set(worldX, -0.5, worldZ);
        groundShape.children.forEach(child => {
            child.receiveShadow = true;
            groundMeshes.push(child);
        });
        groundShapes.push(groundShape);
        scene.add(groundShape);
        
        // Create trees in this tile
        const treesPerWorld = 24;
        for (let j = 0; j < treesPerWorld; j++) {
            const tree = createTreeMesh();
            let angle, dist, posX, posZ;
            
            // 캐릭터 반경 3 안에는 생성 안 함
            do {
                angle = Math.random() * Math.PI * 2;
                dist = Math.random() * (tileSize / 2 - 2);
                posX = worldX + Math.cos(angle) * dist;
                posZ = worldZ + Math.sin(angle) * dist;
            } while (Math.sqrt(posX * posX + posZ * posZ) < 3);
            
            tree.position.set(posX, 0, posZ);
            scene.add(tree);
            trees.push(tree);
        }
    }
    
    // Create center tile (1,1) - special ground
    const centerGroundMat = new THREE.MeshPhongMaterial({ color: 0x6eb366 });
    const centerFloor = new THREE.Mesh(new THREE.BoxGeometry(tileSize, 0.5, tileSize), centerGroundMat);
    centerFloor.position.set(0, -0.5, 0);
    centerFloor.receiveShadow = true;
    centerFloor.userData.isGround = true;
    groundMeshes.push(centerFloor);
    groundShapes.push(centerFloor);
    scene.add(centerFloor);
    
    // Create trees in center tile
    const centerTreesCount = 24;
    for (let j = 0; j < centerTreesCount; j++) {
        const tree = createTreeMesh();
        let angle, dist, posX, posZ;
        
        // 캐릭터 반경 3 안에는 생성 안 함
        do {
            angle = Math.random() * Math.PI * 2;
            dist = Math.random() * (tileSize / 2 - 2);
            posX = Math.cos(angle) * dist;
            posZ = Math.sin(angle) * dist;
        } while (Math.sqrt(posX * posX + posZ * posZ) < 3);
        
        tree.position.set(posX, 0, posZ);
        scene.add(tree);
        trees.push(tree);
    }
}

function createGroundShape(shapeType, groundMat, scale = 1) {
    const group = new THREE.Group();
    const s = scale;
    switch(shapeType) {
        case 'ㄱ':
            const h1 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            h1.position.set(0, 0, 0);
            h1.userData.isGround = true;
            group.add(h1);
            const v1 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            v1.position.set(10*s, 0, 15*s);
            v1.userData.isGround = true;
            group.add(v1);
            break;
        case 'ㄴ':
            const l1 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            l1.position.set(0, 0, -10*s);
            group.add(l1);
            const l2 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            l2.position.set(0, 0, 10*s);
            group.add(l2);
            break;
        case 'ㄷ':
            const d1 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            d1.position.set(-15*s, 0, 0);
            group.add(d1);
            const d2 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            d2.position.set(0, 0, -10*s);
            group.add(d2);
            const d3 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            d3.position.set(0, 0, 10*s);
            group.add(d3);
            break;
        case 'ㄹ':
            const r1 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            r1.position.set(-12*s, 0, 0);
            group.add(r1);
            const r2 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            r2.position.set(6*s, 0, -10*s);
            group.add(r2);
            const r3 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            r3.position.set(6*s, 0, 10*s);
            group.add(r3);
            break;
        case 'ㅁ':
            const b1 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            b1.position.set(-15*s, 0, 0);
            group.add(b1);
            const b2 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            b2.position.set(15*s, 0, 0);
            group.add(b2);
            const b3 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            b3.position.set(0, 0, -10*s);
            group.add(b3);
            break;
        case 'ㅂ':
            const bx1 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            bx1.position.set(-15*s, 0, 0);
            group.add(bx1);
            const bx2 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            bx2.position.set(15*s, 0, 0);
            group.add(bx2);
            const bx3 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            bx3.position.set(0, 0, -10*s);
            group.add(bx3);
            const bx4 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            bx4.position.set(0, 0, 10*s);
            group.add(bx4);
            break;
        case 'ㅅ':
            const s1 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            s1.position.set(6*s, 0, -10*s);
            group.add(s1);
            const s2 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            s2.position.set(-6*s, 0, 10*s);
            group.add(s2);
            break;
        case 'ㅇ':
            const circ = new THREE.Mesh(new THREE.CylinderGeometry(15*s, 15*s, 0.5, 32), groundMat);
            circ.position.set(0, 0, 0);
            group.add(circ);
            break;
        case 'ㅈ':
            const x1 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 36*s), groundMat);
            x1.position.set(0, 0.1, 0);
            x1.rotation.y = Math.PI / 4;
            group.add(x1);
            const x2 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 36*s), groundMat);
            x2.position.set(0, 0.1, 0);
            x2.rotation.y = -Math.PI / 4;
            group.add(x2);
            break;
        case 'ㅊ':
            const y1 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            y1.position.set(-10*s, 0, 0);
            group.add(y1);
            const y2 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            y2.position.set(10*s, 0, 0);
            group.add(y2);
            const y3 = new THREE.Mesh(new THREE.BoxGeometry(24*s, 0.5, 10*s), groundMat);
            y3.position.set(0, 0, -15*s);
            group.add(y3);
            break;
        case 'ㅋ':
            const k1 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            k1.position.set(-12*s, 0, 0);
            group.add(k1);
            const k2 = new THREE.Mesh(new THREE.BoxGeometry(24*s, 0.5, 10*s), groundMat);
            k2.position.set(6*s, 0, -10*s);
            group.add(k2);
            const k3 = new THREE.Mesh(new THREE.BoxGeometry(24*s, 0.5, 10*s), groundMat);
            k3.position.set(6*s, 0, 10*s);
            group.add(k3);
            break;
        case 'ㅌ':
            const t1 = new THREE.Mesh(new THREE.BoxGeometry(30*s, 0.5, 10*s), groundMat);
            t1.position.set(0, 0, -15*s);
            group.add(t1);
            const t2 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            t2.position.set(0, 0, 0);
            group.add(t2);
            break;
        case 'ㅎ':
            const hh1 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            hh1.position.set(-10*s, 0, 0);
            group.add(hh1);
            const hh2 = new THREE.Mesh(new THREE.BoxGeometry(10*s, 0.5, 30*s), groundMat);
            hh2.position.set(10*s, 0, 0);
            group.add(hh2);
            const hh3 = new THREE.Mesh(new THREE.BoxGeometry(18*s, 0.5, 10*s), groundMat);
            hh3.position.set(0, 0, -10*s);
            group.add(hh3);
            const hh4 = new THREE.Mesh(new THREE.BoxGeometry(18*s, 0.5, 10*s), groundMat);
            hh4.position.set(0, 0, 10*s);
            group.add(hh4);
            break;
    }
    // Mark all children as ground meshes
    group.children.forEach(child => {
        child.userData.isGround = true;
    });
    return group;
}

function createGroundShapeFromGrid(grid, material) {
    const group = new THREE.Group();
    const cellSize = 4; // 15x15 격자를 4배 확대하여 60x60 효과
    
    // 격자를 순회하며 1인 위치에 바닥 생성
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x] === 1) {
                // 격자의 중심을 (0, 0)으로 맞추기
                // 15x15의 중앙은 7.5이므로, 각 셀의 중앙이 정렬되도록 계산
                const meshX = (x - 7.5) * cellSize;
                const meshZ = (y - 7.5) * cellSize;
                
                const mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(cellSize * 0.95, 0.5, cellSize * 0.95),
                    material
                );
                mesh.position.set(meshX, 0, meshZ);
                mesh.userData.isGround = true;
                group.add(mesh);
            }
        }
    }
    
    return group;
}

function createTreeMesh() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), new THREE.MeshPhongMaterial({ color: 0x3e2716 }));
    trunk.position.y = 0.5;
    g.add(trunk);
    const leaves = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 1.5), new THREE.MeshPhongMaterial({ color: 0x234d20 }));
    leaves.position.y = 2;
    g.add(leaves);
    
    // Add collision data
    g.userData = { isTree: true, radius: 0.7 };
    return g;
}

function spawnMonster() {
    if (enemies.length > totalEnemiesInStage || enemiesDefeated >= totalEnemiesInStage) return;
    const type = Math.random() > 0.7 ? 'skeleton' : Math.random() > 0.4 ? 'wolf' : 'slime';
    const en = new THREE.Group();
    let color = type === 'slime' ? 0x55ff55 : type === 'wolf' ? 0xaaaaaa : 0xeeeeee;
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshPhongMaterial({ color }));
    body.position.y = 0.4;
    en.add(body);
    
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeL.position.set(0.2, 0.6, 0.41);
    eyeL.name = "eyeL";
    en.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeR.position.set(-0.2, 0.6, 0.41);
    eyeR.name = "eyeR";
    en.add(eyeR);

    const angle = Math.random() * Math.PI * 2;
    const spawnX = playerGroup.position.x + Math.cos(angle) * 8;
    const spawnZ = playerGroup.position.z + Math.sin(angle) * 8;
    
    en.position.set(spawnX, 0, spawnZ);
    en.scale.set(0.01, 0.01, 0.01);
    en.userData = { 
        hp: 40 * stage, maxHp: 40 * stage, type, 
        speed: 0.03 + Math.random()*0.03, attackCooldown: 0, 
        hitFlash: 0, state: 'normal', spawnScale: 0.01 
    };
    
    playSound('spawn');
    scene.add(en);
    enemies.push(en);
}

function update() {
    if (!gameActive) return;

    if (!PLAYER_DATA.isFalling) {
        stageTime -= 1/60;
        if (enemiesDefeated >= totalEnemiesInStage && enemies.length === 0) {
            gameActive = false;
            document.getElementById('shop-ui').style.display = 'flex';
        }
    }

    const totalMapWidth = WORLD_SIZE;
    const totalMapHeight = WORLD_SIZE;
    const mapBoundX = WORLD_SIZE / 2;
    const mapBoundZ = WORLD_SIZE / 2;
    
    // Check if player is on valid ground
    if (!checkGroundCollision(playerGroup.position)) {
        PLAYER_DATA.isFalling = true;
        document.getElementById('fall-alert').style.display = 'block';
    } else {
        PLAYER_DATA.isFalling = false;
        document.getElementById('fall-alert').style.display = 'none';
    }

    if (PLAYER_DATA.isFalling) {
        playerGroup.position.y -= 0.15;
        if (playerGroup.position.y < -15) endGame("낙상");
        return;
    }

    let moveAllowed = !PLAYER_DATA.isBlocking && PLAYER_DATA.attackTimer < 15;
    if (moveAllowed) {
        const prevX = playerGroup.position.x;
        const prevZ = playerGroup.position.z;
        
        if (keys['ArrowRight']) { playerGroup.position.x += PLAYER_DATA.speed; PLAYER_DATA.direction = 1; playerGroup.rotation.y = 0; }
        if (keys['ArrowLeft']) { playerGroup.position.x -= PLAYER_DATA.speed; PLAYER_DATA.direction = -1; playerGroup.rotation.y = Math.PI; }
        if (keys['ArrowUp']) playerGroup.position.z -= PLAYER_DATA.speed * 0.7;
        if (keys['ArrowDown']) playerGroup.position.z += PLAYER_DATA.speed * 0.7;
        
        // Check tree collision
        if (checkTreeCollision(playerGroup.position)) {
            playerGroup.position.x = prevX;
            playerGroup.position.z = prevZ;
        }
    }

    // Camera fixed to player center
    camera.position.x = playerGroup.position.x;
    camera.position.y = playerGroup.position.y + 5;
    camera.position.z = playerGroup.position.z + 12;

    if (keys['Space'] && !PLAYER_DATA.isJumping) { PLAYER_DATA.isJumping = true; PLAYER_DATA.jumpV = 0.25; playSound('jump'); }
    if (PLAYER_DATA.isJumping) {
        playerGroup.position.y += PLAYER_DATA.jumpV;
        PLAYER_DATA.jumpV -= 0.012;
        if (playerGroup.position.y <= 0) { playerGroup.position.y = 0; PLAYER_DATA.isJumping = false; }
    }

    PLAYER_DATA.isBlocking = keys['KeyX'];
    if (keys['KeyZ'] && !PLAYER_DATA.isBlocking) {
        PLAYER_DATA.chargeTime++;
        document.getElementById('charge-bar').style.display = 'block';
        document.getElementById('charge-fill').style.width = Math.min(100, (PLAYER_DATA.chargeTime / 60) * 100) + '%';
    } else if (PLAYER_DATA.chargeTime > 0) {
        performAttack();
    }

    if (PLAYER_DATA.attackTimer > 0) {
        PLAYER_DATA.attackTimer--;
        swordMesh.rotation.z = Math.sin(PLAYER_DATA.attackTimer * 0.5) * 2;
    } else {
        swordMesh.rotation.z = 0;
    }

    enemies.forEach((en, i) => {
        if (en.userData.spawnScale < 1) {
            en.userData.spawnScale += 0.08;
            let s = en.userData.spawnScale;
            en.scale.set(s, s, s);
        }

        const dist = en.position.distanceTo(playerGroup.position);
        const eyeL = en.getObjectByName("eyeL");
        const eyeR = en.getObjectByName("eyeR");

        if (en.userData.hitFlash > 0) {
            en.userData.state = 'hurt';
            en.userData.hitFlash--;
            if (eyeL) eyeL.scale.set(1.5, 0.2, 1);
            if (eyeR) eyeR.scale.set(1.5, 0.2, 1);
            en.scale.set(1.2, 0.7, 1.2); 
        } else if (en.userData.attackCooldown > 60) {
            en.userData.state = 'angry';
            if (eyeL) eyeL.material.color.set(0xff0000);
            if (eyeR) eyeR.material.color.set(0xff0000);
            en.scale.set(1.1, 1.1, 1.1);
        } else {
            en.userData.state = 'normal';
            if (eyeL) { eyeL.scale.set(1, 1, 1); eyeL.material.color.set(0x000000); }
            if (eyeR) { eyeR.scale.set(1, 1, 1); eyeR.material.color.set(0x000000); }
            if (en.userData.spawnScale >= 1) en.scale.set(1, 1, 1);
        }

        if (dist > 1.2 && en.userData.state !== 'hurt') {
            const dir = new THREE.Vector3().subVectors(playerGroup.position, en.position).normalize();
            const newX = en.position.x + dir.x * en.userData.speed;
            const newZ = en.position.z + dir.z * en.userData.speed;
            
            // 새로운 위치에 바닥이 있으면 이동
            if (checkGroundCollision({ x: newX, z: newZ, y: en.position.y })) {
                en.position.x = newX;
                en.position.z = newZ;
            }
        } else if (en.userData.attackCooldown <= 0 && en.userData.state !== 'hurt') {
            en.userData.attackCooldown = 100;
            if (PLAYER_DATA.shieldTimer <= 0 && !PLAYER_DATA.isBlocking) {
                PLAYER_DATA.hp -= 12;
                shakeCamera();
                playSound('hit');
            }
        }
        if (en.userData.attackCooldown > 0) en.userData.attackCooldown--;
        
        // Check if enemy is on valid ground
        if (!checkGroundCollision(en.position)) {
            en.position.y -= 0.2;
            if (en.position.y < -10) {
                // Remove enemy if it falls too far
                scene.remove(en);
                enemies.splice(i, 1);
            }
        }

        if (en.userData.hp <= 0) {
            dropItem(en.position);
            PLAYER_DATA.xp += 1;
            enemiesDefeated++;
            scene.remove(en);
            enemies.splice(i, 1);
            checkLevelUp();
        }
    });

    items.forEach((it, i) => {
        if (it.position.distanceTo(playerGroup.position) < 1) {
            if (it.userData.type === 'potion') PLAYER_DATA.hp = Math.min(PLAYER_DATA.maxHp, PLAYER_DATA.hp + 30);
            if (it.userData.type === 'coin') money += 50;
            scene.remove(it);
            items.splice(i, 1);
            playSound('levelup');
        }
    });

    if (Math.random() < 0.01) spawnMonster();

    document.getElementById('hp-fill').style.width = (PLAYER_DATA.hp / PLAYER_DATA.maxHp) * 100 + '%';
    document.getElementById('money-val').innerText = money;
    document.getElementById('lv-val').innerText = PLAYER_DATA.lv;
    document.getElementById('xp-val').innerText = PLAYER_DATA.xp;
    document.getElementById('next-xp-val').innerText = PLAYER_DATA.nextXp;
    let m = Math.floor(stageTime/60), s = Math.floor(stageTime%60);
    document.getElementById('timer').innerText = `Stage ${stage} - ${m}:${s.toString().padStart(2,'0')}`;

    if (PLAYER_DATA.hp <= 0) endGame("전투 불능");
    if (PLAYER_DATA.shieldTimer > 0) { PLAYER_DATA.shieldTimer--; shieldMesh.visible = true; }
    else { shieldMesh.visible = false; }
}

function performAttack() {
    PLAYER_DATA.isAttacking = true;
    PLAYER_DATA.attackTimer = 30;
    playSound('attack');
    
    let range = 2.2 + (PLAYER_DATA.weapon !== 'sword' ? 1.5 : 0);
    let dmg = 25 * PLAYER_DATA.lv;
    let knockback = 2.0;

    if (PLAYER_DATA.chargeTime >= 60) { 
        range *= 2; dmg *= 3; knockback = 5.0; 
        createLightning(); 
        shakeCamera();
    }

    enemies.forEach(en => {
        if (en.position.distanceTo(playerGroup.position) < range) {
            en.userData.hp -= dmg;
            en.userData.hitFlash = 30;
            const pushDir = new THREE.Vector3().subVectors(en.position, playerGroup.position).normalize();
            en.position.x += pushDir.x * knockback;
            en.position.z += pushDir.z * knockback * 0.5;
            playSound('hit');
        }
    });

    PLAYER_DATA.chargeTime = 0;
    document.getElementById('charge-bar').style.display = 'none';
}

function createLightning() {
    const geo = new THREE.CylinderGeometry(0.15, 0.8, 15, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const l = new THREE.Mesh(geo, mat);
    l.position.set(playerGroup.position.x, 7.5, playerGroup.position.z);
    scene.add(l);
    setTimeout(() => scene.remove(l), 150);
}

function dropItem(pos) {
    const type = Math.random() > 0.5 ? 'coin' : 'potion';
    const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const mat = new THREE.MeshPhongMaterial({ color: type === 'coin' ? 0xffd700 : 0xff0000 });
    const it = new THREE.Mesh(geo, mat);
    it.position.copy(pos);
    it.position.y = 0.2;
    it.userData = { type };
    scene.add(it);
    items.push(it);
}

function checkTreeCollision(playerPos) {
    const playerRadius = 0.5;
    for (let tree of trees) {
        const dist = Math.sqrt(
            Math.pow(playerPos.x - tree.position.x, 2) + 
            Math.pow(playerPos.z - tree.position.z, 2)
        );
        if (dist < playerRadius + tree.userData.radius) {
            return true;
        }
    }
    return false;
}

function checkGroundCollision(pos) {
    // groundShapes의 각 shape에 대해 ray casting 수행
    if (groundShapes.length === 0) return true;
    
    // 캐릭터 주변의 여러 위치에서 바닥 확인
    const checkPoints = [
        { x: pos.x, z: pos.z },           // 중앙
        { x: pos.x + 1, z: pos.z },       // 오른쪽
        { x: pos.x - 1, z: pos.z },       // 왼쪽
        { x: pos.x, z: pos.z + 1 },       // 앞
        { x: pos.x, z: pos.z - 1 },       // 뒤
        { x: pos.x + 0.7, z: pos.z + 0.7 }, // 대각선
        { x: pos.x - 0.7, z: pos.z + 0.7 }, // 대각선
        { x: pos.x + 0.7, z: pos.z - 0.7 }, // 대각선
        { x: pos.x - 0.7, z: pos.z - 0.7 }  // 대각선
    ];
    
    // 하나라도 바닥이 있으면 안전
    for (let checkPos of checkPoints) {
        raycaster.set(
            new THREE.Vector3(checkPos.x, pos.y + 1, checkPos.z), 
            new THREE.Vector3(0, -1, 0)
        );
        
        for (let shape of groundShapes) {
            const intersects = raycaster.intersectObject(shape, true);
            if (intersects.length > 0 && intersects[0].distance > 0.5) {
                return true; // 바닥 감지
            }
        }
    }
    
    return false; // 모든 위치에서 바닥 없음 → 떨어짐
}

function checkLevelUp() {
    if (PLAYER_DATA.xp >= PLAYER_DATA.nextXp) {
        PLAYER_DATA.lv++;
        PLAYER_DATA.xp = 0;
        PLAYER_DATA.nextXp *= 2;
        PLAYER_DATA.hp = PLAYER_DATA.maxHp;
        PLAYER_DATA.shieldTimer = 300;
        playSound('levelup');
        createLightning();
        
        if (PLAYER_DATA.lv === 2) {
            const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), new THREE.MeshPhongMaterial({ color: 0x888888 }));
            hornL.position.set(0.3, 1.7, 0);
            playerGroup.add(hornL);
            const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), new THREE.MeshPhongMaterial({ color: 0x888888 }));
            hornR.position.set(-0.3, 1.7, 0);
            playerGroup.add(hornR);
        }
        if (PLAYER_DATA.lv >= 3) swordMesh.scale.y = 1.8;
    }
}

function buyWeapon(type, cost) {
    if (money >= cost) {
        money -= cost;
        PLAYER_DATA.weapon = type;
        if (type === 'axe') swordMesh.scale.set(4, 1, 4);
        if (type === 'legend') swordMesh.material.color.set(0x00ffff);
        alert("새로운 무기를 장착했습니다!");
    } else alert("돈이 부족합니다!");
}

function nextStage() {
    stage++;
    stageTime = 120;
    totalEnemiesInStage *= 2;
    enemiesDefeated = 0;
    document.getElementById('shop-ui').style.display = 'none';
    gameActive = true;
}

function spawnBoss() {
    gameActive = false;
    const boss = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
    body.position.y = 2;
    boss.add(body);
    
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.2), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeL.position.set(1, 3, 2.1); eyeL.name = "eyeL"; boss.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.2), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeR.position.set(-1, 3, 2.1); eyeR.name = "eyeR"; boss.add(eyeR);

    boss.position.set(playerGroup.position.x + 15, 0, 0);
    boss.userData = { 
        hp: 1500 * stage, maxHp: 1500 * stage, isBoss: true, 
        speed: 0.02, attackCooldown: 0, hitFlash: 0, state: 'normal', spawnScale: 1 
    };
    scene.add(boss);
    enemies.push(boss);
    gameActive = true;
}

function shakeCamera() {
    const originalY = camera.position.y;
    let count = 0;
    const interval = setInterval(() => {
        camera.position.y = originalY + (Math.random()-0.5)*0.6;
        if (++count > 12) { clearInterval(interval); camera.position.y = originalY; }
    }, 30);
}

function endGame(reason) {
    gameActive = false;
    document.getElementById('fail-title').innerText = reason === "낙상" ? "추락 주의!" : "GAME OVER";
    document.getElementById('fail-msg').innerText = reason === "낙상" ? "월드 밖으로 떨어졌습니다." : "체력이 다 되었습니다.";
    document.getElementById('game-over').style.display = 'flex';
}

function animate() {
    if (!gameActive) { 
        if (renderer) renderer.render(scene, camera); 
        requestAnimationFrame(animate); 
        return; 
    }
    update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Global function binding
window.initGame = initGame;
window.buyWeapon = buyWeapon;
window.nextStage = nextStage;

console.log("✅ Global functions bound", { initGame: typeof window.initGame, buyWeapon: typeof window.buyWeapon, nextStage: typeof window.nextStage });
