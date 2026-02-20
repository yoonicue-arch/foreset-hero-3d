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
    switch (type) {
        case 'jump': osc.type = 'square'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1); gain.gain.setValueAtTime(0.05, now); osc.start(); osc.stop(now + 0.1); break;
        case 'attack': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1); gain.gain.setValueAtTime(0.05, now); osc.start(); osc.stop(now + 0.1); break;
        case 'hit': osc.type = 'sine'; osc.frequency.setValueAtTime(100, now); gain.gain.setValueAtTime(0.1, now); osc.start(); osc.stop(now + 0.05); break;
        case 'levelup': [440, 554, 659].forEach((f, i) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.connect(g); g.connect(audioCtx.destination); o.frequency.setValueAtTime(f, now + i * 0.1); g.gain.setValueAtTime(0.05, now + i * 0.1); o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.1); }); break;
        case 'spawn': osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1); gain.gain.setValueAtTime(0.05, now); osc.start(); osc.stop(now + 0.1); break;

        // Tree Sounds
        case 'tree_hit':
            // Wood chopping sound - short burst of noise + low sine
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 2 - 1;
            const noiseSrc = audioCtx.createBufferSource();
            noiseSrc.buffer = noiseBuffer;
            const noiseFilter = audioCtx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 800;
            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.3, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            noiseSrc.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            noiseSrc.start();
            break;

        case 'explosion':
            // Explosion sound - low frequency noise burst
            const expOsc = audioCtx.createOscillator();
            expOsc.type = 'sawtooth';
            expOsc.frequency.setValueAtTime(100, now);
            expOsc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
            const expGain = audioCtx.createGain();
            expGain.gain.setValueAtTime(1, now);
            expGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            expOsc.connect(expGain);
            expGain.connect(audioCtx.destination);
            expOsc.start();
            expOsc.stop(now + 0.6);
            break;
        case 'boss_intro':
            // Babababam! (C4, C4, C4, F4)
            [261, 261, 261, 349].forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'sawtooth';
                o.connect(g);
                g.connect(audioCtx.destination);
                const start = now + i * 0.2;
                o.frequency.setValueAtTime(f, start);
                g.gain.setValueAtTime(0.2, start);
                g.gain.exponentialRampToValueAtTime(0.01, start + 0.18);
                o.start(start);
                o.stop(start + 0.18);
            });
            break;

        // Monster Specific Attack Sounds
        case 'atk_slime':
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1); gain.gain.setValueAtTime(0.03, now); osc.start(); osc.stop(now + 0.1); break;
        case 'atk_wolf':
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.2); gain.gain.setValueAtTime(0.05, now); osc.start(); osc.stop(now + 0.2); break;
        case 'atk_skeleton':
            for (let i = 0; i < 3; i++) {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = 'square'; o.frequency.setValueAtTime(800 + i * 400, now + i * 0.03); g.gain.setValueAtTime(0.02, now + i * 0.03);
                o.connect(g); g.connect(audioCtx.destination); o.start(now + i * 0.03); o.stop(now + i * 0.03 + 0.05);
            } break;
        case 'atk_golem':
            osc.type = 'sine'; osc.frequency.setValueAtTime(80, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.3); gain.gain.setValueAtTime(0.2, now); osc.start(); osc.stop(now + 0.3); break;
        case 'atk_ghost':
            osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(900, now + 0.4); gain.gain.setValueAtTime(0.03, now); osc.start(); osc.stop(now + 0.4); break;
        case 'atk_spider':
            osc.type = 'square'; osc.frequency.setValueAtTime(1000, now); osc.frequency.linearRampToValueAtTime(2000, now + 0.05); gain.gain.setValueAtTime(0.02, now); osc.start(); osc.stop(now + 0.05); break;
        case 'atk_boss':
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(60, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.5); gain.gain.setValueAtTime(0.3, now); osc.start(); osc.stop(now + 0.5); break;
    }
}

// --- 3D Scene Setup ---
let scene, camera, renderer, clock, raycaster;
let playerGroup, swordMesh, shieldMesh;
let trees = [], enemies = [], items = [], projectiles = [], groundMeshes = [], groundShapes = [];
let gameActive = false;
const GAME_SETTINGS = {
    // 몬스터 설정
    MONSTER: {
        MAX_SIZE: 3.0,           // 몬스터 최대 크기 배율
        BASE_SCORE: 100,         // 기본 몬스터 점수 (1배 크기)
        BASE_DAMAGE: 12,         // 몬스터 기본 공격력
        NORMAL_CHANCE: 0.9,      // 1스테이지에서 1배 크기 몬스터 나올 확률 (90%)
        CHANCE_DECAY: 0.05       // 스테이지 진행 시 1배 크기 확률 감소량 (5%)
    },
    // 아이템 설정
    ITEM: {
        DROP_RATE: 0.5,          // 아이템 드랍 확률 (50%)
        POTION_RATE: 0.5,        // 드랍된 아이템이 포션일 확률 (1스테이지 기준 50%)
        POTION_DECAY: 0.05       // 스테이지 진행 시 포션 확률 감소량 (5%)
    }
};

let stage = 1;
let stageTime = 120; // 2 minutes
let money = 0;
let score = 0;
let totalEnemiesInStage = 10;
let enemiesDefeated = 0;
let bossSpawned = false;
const keys = {};

const UPGRADE_DATA = {
    swordLength: { level: 0, cost: 100, costInc: 100 },
    moveSpeed: { level: 0, cost: 100, costInc: 100 },
    jumpPower: { level: 0, cost: 100, costInc: 100 }
};

const PLAYER_DATA = {
    x: 0, y: 0, z: 0,
    hp: 100, maxHp: 100, lv: 1, xp: 0, nextXp: 5,
    speed: 0.15, jumpV: 0, isJumping: false,
    jumpMaxV: 0.25,
    isAttacking: false, attackTimer: 0, chargeTime: 0,
    weapon: 'sword', direction: 1, shieldTimer: 0,
    isFalling: false,
    swordScaleY: 1.2,
    // 스태미나 시스템
    stamina: 5, maxStamina: 5,
    staminaExhausted: false,  // 5칼 전부 소진 시 불능 상태
    staminaRegenTimer: 0      // 1초(60프레임)모닙
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
        if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => keys[e.code] = false);
}

function createPlayer() {
    playerGroup = new THREE.Group();

    // Body (Torso)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.4), new THREE.MeshPhongMaterial({ color: 0x1e90ff }));
    torso.position.y = 0.8;
    torso.castShadow = true;
    playerGroup.add(torso);

    // Head
    const headGroup = new THREE.Group();
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshPhongMaterial({ color: 0xffdbac }));
    headGroup.add(head);

    // Hair/Helmet detail
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), new THREE.MeshPhongMaterial({ color: 0x4a2c2a }));
    hair.position.y = 0.25;
    headGroup.add(hair);

    // Eyes (front only)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    // 앞쪽 눈만 추가
    const eyeFL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMat);
    eyeFL.position.set(0.15, 0.1, 0.3);
    const eyeFR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMat);
    eyeFR.position.set(-0.15, 0.1, 0.3);
    headGroup.add(eyeFL, eyeFR);

    // 뒷머리 블록 (뒤에서 봤을 때 머리카락이 더 두툼하게 보이도록)
    const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.45, 0.15), new THREE.MeshPhongMaterial({ color: 0x4a2c2a }));
    backHair.position.set(0, 0.05, -0.35);
    headGroup.add(backHair);

    headGroup.position.y = 1.5;
    playerGroup.add(headGroup);

    // Limbs (Arms & Legs)
    const limbMat = new THREE.MeshPhongMaterial({ color: 0x1e90ff });
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), limbMat);
    armL.position.set(0.45, 0.8, 0);
    playerGroup.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), limbMat);
    armR.position.set(-0.45, 0.8, 0);
    playerGroup.add(armR);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), new THREE.MeshPhongMaterial({ color: 0x333333 }));
    legL.position.set(0.2, 0.25, 0);
    playerGroup.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), new THREE.MeshPhongMaterial({ color: 0x333333 }));
    legR.position.set(-0.2, 0.25, 0);
    playerGroup.add(legR);

    // Store references for animation and upgrades
    playerGroup.userData.limbs = { armL, armR, legL, legR };
    playerGroup.userData.head = headGroup;
    playerGroup.userData.torso = torso;

    // Redesigned Sword (Pivot at Handle/Hand)
    swordMesh = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), new THREE.MeshPhongMaterial({ color: 0x5d4037 }));
    handle.position.y = -0.15; // Grip point will be (0,0,0)
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.15), new THREE.MeshPhongMaterial({ color: 0xffd700 }));
    guard.position.y = 0.02;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.05), new THREE.MeshPhongMaterial({ color: 0xdddddd }));
    blade.name = "blade";
    blade.position.y = 0.55;
    blade.castShadow = true;
    swordMesh.add(handle, guard, blade);

    swordMesh.position.set(0.5, 1.0, 0);
    // 기본 자세: 칼날 위로 (정면에서 보면 | 모양)
    swordMesh.rotation.set(0, 0, 0);
    PLAYER_DATA.swordScaleY = 1.0;
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
    switch (shapeType) {
        case 'ㄱ':
            const h1 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            h1.position.set(0, 0, 0);
            h1.userData.isGround = true;
            group.add(h1);
            const v1 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            v1.position.set(10 * s, 0, 15 * s);
            v1.userData.isGround = true;
            group.add(v1);
            break;
        case 'ㄴ':
            const l1 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            l1.position.set(0, 0, -10 * s);
            group.add(l1);
            const l2 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            l2.position.set(0, 0, 10 * s);
            group.add(l2);
            break;
        case 'ㄷ':
            const d1 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            d1.position.set(-15 * s, 0, 0);
            group.add(d1);
            const d2 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            d2.position.set(0, 0, -10 * s);
            group.add(d2);
            const d3 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            d3.position.set(0, 0, 10 * s);
            group.add(d3);
            break;
        case 'ㄹ':
            const r1 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            r1.position.set(-12 * s, 0, 0);
            group.add(r1);
            const r2 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            r2.position.set(6 * s, 0, -10 * s);
            group.add(r2);
            const r3 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            r3.position.set(6 * s, 0, 10 * s);
            group.add(r3);
            break;
        case 'ㅁ':
            const b1 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            b1.position.set(-15 * s, 0, 0);
            group.add(b1);
            const b2 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            b2.position.set(15 * s, 0, 0);
            group.add(b2);
            const b3 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            b3.position.set(0, 0, -10 * s);
            group.add(b3);
            break;
        case 'ㅂ':
            const bx1 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            bx1.position.set(-15 * s, 0, 0);
            group.add(bx1);
            const bx2 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            bx2.position.set(15 * s, 0, 0);
            group.add(bx2);
            const bx3 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            bx3.position.set(0, 0, -10 * s);
            group.add(bx3);
            const bx4 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            bx4.position.set(0, 0, 10 * s);
            group.add(bx4);
            break;
        case 'ㅅ':
            const s1 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            s1.position.set(6 * s, 0, -10 * s);
            group.add(s1);
            const s2 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            s2.position.set(-6 * s, 0, 10 * s);
            group.add(s2);
            break;
        case 'ㅇ':
            const circ = new THREE.Mesh(new THREE.CylinderGeometry(15 * s, 15 * s, 0.5, 32), groundMat);
            circ.position.set(0, 0, 0);
            group.add(circ);
            break;
        case 'ㅈ':
            const x1 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 36 * s), groundMat);
            x1.position.set(0, 0.1, 0);
            x1.rotation.y = Math.PI / 4;
            group.add(x1);
            const x2 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 36 * s), groundMat);
            x2.position.set(0, 0.1, 0);
            x2.rotation.y = -Math.PI / 4;
            group.add(x2);
            break;
        case 'ㅊ':
            const y1 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            y1.position.set(-10 * s, 0, 0);
            group.add(y1);
            const y2 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            y2.position.set(10 * s, 0, 0);
            group.add(y2);
            const y3 = new THREE.Mesh(new THREE.BoxGeometry(24 * s, 0.5, 10 * s), groundMat);
            y3.position.set(0, 0, -15 * s);
            group.add(y3);
            break;
        case 'ㅋ':
            const k1 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            k1.position.set(-12 * s, 0, 0);
            group.add(k1);
            const k2 = new THREE.Mesh(new THREE.BoxGeometry(24 * s, 0.5, 10 * s), groundMat);
            k2.position.set(6 * s, 0, -10 * s);
            group.add(k2);
            const k3 = new THREE.Mesh(new THREE.BoxGeometry(24 * s, 0.5, 10 * s), groundMat);
            k3.position.set(6 * s, 0, 10 * s);
            group.add(k3);
            break;
        case 'ㅌ':
            const t1 = new THREE.Mesh(new THREE.BoxGeometry(30 * s, 0.5, 10 * s), groundMat);
            t1.position.set(0, 0, -15 * s);
            group.add(t1);
            const t2 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            t2.position.set(0, 0, 0);
            group.add(t2);
            break;
        case 'ㅎ':
            const hh1 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            hh1.position.set(-10 * s, 0, 0);
            group.add(hh1);
            const hh2 = new THREE.Mesh(new THREE.BoxGeometry(10 * s, 0.5, 30 * s), groundMat);
            hh2.position.set(10 * s, 0, 0);
            group.add(hh2);
            const hh3 = new THREE.Mesh(new THREE.BoxGeometry(18 * s, 0.5, 10 * s), groundMat);
            hh3.position.set(0, 0, -10 * s);
            group.add(hh3);
            const hh4 = new THREE.Mesh(new THREE.BoxGeometry(18 * s, 0.5, 10 * s), groundMat);
            hh4.position.set(0, 0, 10 * s);
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
    trunk.castShadow = true;
    g.add(trunk);
    const leaves = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 1.5), new THREE.MeshPhongMaterial({ color: 0x234d20 }));
    leaves.position.y = 2;
    leaves.castShadow = true;
    g.add(leaves);

    // Add collision data & Interaction properties
    // HP: 20 (10 hits -> fire -> 10 hits -> explode)
    g.userData = {
        isTree: true,
        radius: 0.7,
        hp: 20,
        shakeTimer: 0,
        isOnFire: false
    };
    return g;
}

function createMonsterMesh(type) {
    const group = new THREE.Group();
    let color = 0x55ff55;

    switch (type) {
        case 'slime':
            color = 0x55ff55;
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.8 }));
            body.position.y = 0.3;
            body.castShadow = true;
            group.add(body);
            addEyes(group, 0.4);
            break;
        case 'wolf':
            color = 0x888888;
            const wBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1.2), new THREE.MeshPhongMaterial({ color }));
            wBody.position.y = 0.5;
            wBody.castShadow = true;
            group.add(wBody);
            // Snout
            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), new THREE.MeshPhongMaterial({ color: 0x333333 }));
            snout.position.set(0, 0.6, 0.7);
            group.add(snout);
            addEyes(group, 0.6, 0.5);
            break;
        case 'skeleton':
            color = 0xe0e0e0;
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshPhongMaterial({ color }));
            head.position.y = 0.8;
            group.add(head);
            const ribs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), new THREE.MeshPhongMaterial({ color }));
            ribs.position.y = 0.4;
            group.add(ribs);
            addEyes(group, 0.85);
            break;
        case 'golem':
            color = 0x607d8b;
            const gBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.0), new THREE.MeshPhongMaterial({ color }));
            gBody.position.y = 0.6;
            gBody.castShadow = true;
            group.add(gBody);
            addEyes(group, 1.0);
            break;
        case 'ghost':
            color = 0xffffff;
            const ghBody = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.6 }));
            ghBody.position.y = 0.8;
            group.add(ghBody);
            addEyes(group, 0.9);
            break;
        case 'spider':
            color = 0x212121;
            const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), new THREE.MeshPhongMaterial({ color }));
            sBody.position.y = 0.3;
            group.add(sBody);
            // Legs
            for (let i = 0; i < 8; i++) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), new THREE.MeshPhongMaterial({ color }));
                const angle = (i / 8) * Math.PI * 2;
                leg.position.set(Math.cos(angle) * 0.4, 0.2, Math.sin(angle) * 0.4);
                group.add(leg);
            }
            addEyes(group, 0.4, 0.3, 0xff0000); // Red eyes
            break;
    }
    // Fist (Hitbox/Punch)
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshPhongMaterial({ color: 0x880000 }));
    fist.name = "fist";
    fist.visible = false;
    fist.castShadow = true;
    group.add(fist);

    return group;
}

function addEyes(group, y, z = 0.4, color = 0x000000) {
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), new THREE.MeshBasicMaterial({ color }));
    eyeL.position.set(0.2, y, z);
    eyeL.name = "eyeL";
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), new THREE.MeshBasicMaterial({ color }));
    eyeR.position.set(-0.2, y, z);
    eyeR.name = "eyeR";
    group.add(eyeL, eyeR);
}

function spawnMonster() {
    if (enemies.length > totalEnemiesInStage || enemiesDefeated >= totalEnemiesInStage) return;

    // New Variety logic
    const rand = Math.random();
    let type = 'slime';
    if (rand > 0.9) type = 'golem';
    else if (rand > 0.75) type = 'ghost';
    else if (rand > 0.6) type = 'spider';
    else if (rand > 0.4) type = 'skeleton';
    else if (rand > 0.2) type = 'wolf';

    const en = createMonsterMesh(type);

    // 유효한 땅 위에 스폰될 때까지 최대 30번 재시도
    let spawnX, spawnZ;
    let spawnFound = false;
    for (let attempt = 0; attempt < 30; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 8 + Math.random() * 8;
        spawnX = playerGroup.position.x + Math.cos(angle) * dist;
        spawnZ = playerGroup.position.z + Math.sin(angle) * dist;
        if (checkGroundCollision({ x: spawnX, z: spawnZ, y: 0 })) {
            spawnFound = true;
            break;
        }
    }
    if (!spawnFound) return; // 유효 위치 못 찾으면 스폰 취소

    en.position.set(spawnX, 0, spawnZ);
    en.scale.set(0.01, 0.01, 0.01);

    let normalChance = Math.max(0.1, GAME_SETTINGS.MONSTER.NORMAL_CHANCE - (stage - 1) * GAME_SETTINGS.MONSTER.CHANCE_DECAY);
    const sizeFactor = Math.random() < normalChance ? 1.0 : (1.0 + Math.random() * (GAME_SETTINGS.MONSTER.MAX_SIZE - 1.0));

    // Type specific stat modifiers
    let hpMod = 1, speedMod = 1, dmgMod = 1;
    if (type === 'golem') { hpMod = 2.5; speedMod = 0.5; dmgMod = 2; }
    if (type === 'ghost') { hpMod = 0.6; speedMod = 1.2; }
    if (type === 'spider') { speedMod = 1.5; dmgMod = 0.8; }

    en.userData = {
        hp: 40 * stage * sizeFactor * hpMod, maxHp: 40 * stage * sizeFactor * hpMod, type,
        speed: ((0.03 + Math.random() * 0.03) * speedMod) / Math.sqrt(sizeFactor),
        attackTimer: 0,
        attackCooldown: 0,
        hitFlash: 0, state: 'normal',
        spawnScale: 0.01, targetScale: sizeFactor,
        sizeFactor: sizeFactor,
        damage: GAME_SETTINGS.MONSTER.BASE_DAMAGE * sizeFactor * dmgMod,
        lastValidX: spawnX, lastValidZ: spawnZ  // 마지막 유효 위치 저장
    };

    playSound('spawn');
    scene.add(en);
    enemies.push(en);
}

function update() {
    if (!gameActive) return;

    if (!PLAYER_DATA.isFalling) {
        stageTime -= 1 / 60;
        if (enemiesDefeated >= totalEnemiesInStage && enemies.length === 0) {
            if (!bossSpawned) {
                spawnBoss();
                bossSpawned = true;
            } else {
                gameActive = false;
                playSound('levelup'); // Stage clear sound
                updateShopUI(); // Initialize prices
                document.getElementById('shop-ui').style.display = 'flex';
            }
        }
    }

    const totalMapWidth = WORLD_SIZE;
    const totalMapHeight = WORLD_SIZE;
    const mapBoundX = WORLD_SIZE / 2;
    const mapBoundZ = WORLD_SIZE / 2;

    // Check if player is on valid ground
    // 점프 중에는 공중이므로 낙하 판정을 하지 않음 — 착지 후에만 체크
    if (!PLAYER_DATA.isJumping && !checkGroundCollision(playerGroup.position)) {
        PLAYER_DATA.isFalling = true;
        document.getElementById('fall-alert').style.display = 'block';
    } else if (!PLAYER_DATA.isJumping) {
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

        let dx = 0;
        let dz = 0;
        if (keys['ArrowRight']) dx += 1;
        if (keys['ArrowLeft']) dx -= 1;
        if (keys['ArrowUp']) dz -= 1;
        if (keys['ArrowDown']) dz += 1;

        if (dx !== 0 || dz !== 0) {
            const length = Math.sqrt(dx * dx + dz * dz);
            dx /= length;
            dz /= length;

            playerGroup.position.x += dx * PLAYER_DATA.speed;
            playerGroup.position.z += dz * PLAYER_DATA.speed * 0.7;

            playerGroup.rotation.y = Math.atan2(dx, dz);
            PLAYER_DATA.dirX = dx;
            PLAYER_DATA.dirZ = dz;
        }

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

    camera.position.z = playerGroup.position.z + 12;

    // 점프 — 이동 방향으로 슝~ 날아가기
    if (keys['Space'] && !PLAYER_DATA.isJumping) {
        PLAYER_DATA.isJumping = true;
        PLAYER_DATA.jumpV = PLAYER_DATA.jumpMaxV;
        // 현재 이동 방향 저장 (공중에서 계속 그 방향으로 날아감)
        PLAYER_DATA.jumpDirX = (PLAYER_DATA.dirX || 0) * PLAYER_DATA.speed * 1.5;
        PLAYER_DATA.jumpDirZ = (PLAYER_DATA.dirZ || 0) * PLAYER_DATA.speed * 0.7 * 1.5;
        playSound('jump');
    }
    if (PLAYER_DATA.isJumping) {
        playerGroup.position.y += PLAYER_DATA.jumpV;
        playerGroup.position.x += PLAYER_DATA.jumpDirX || 0;
        playerGroup.position.z += PLAYER_DATA.jumpDirZ || 0;
        PLAYER_DATA.jumpV -= 0.012;
        if (playerGroup.position.y <= 0) {
            playerGroup.position.y = 0;
            PLAYER_DATA.isJumping = false;
            PLAYER_DATA.jumpDirX = 0;
            PLAYER_DATA.jumpDirZ = 0;
        }
    }

    PLAYER_DATA.isBlocking = keys['KeyX'];
    // 공격 중(attackTimer > 0)엔 차지도, 재공격도 불가 — 한 번 휘두르고 나서야 다시 공격 가능
    if (PLAYER_DATA.attackTimer <= 0) {
        if (keys['KeyZ'] && !PLAYER_DATA.isBlocking) {
            PLAYER_DATA.chargeTime++;
            document.getElementById('charge-bar').style.display = 'block';
            document.getElementById('charge-fill').style.width = Math.min(100, (PLAYER_DATA.chargeTime / 60) * 100) + '%';
        } else if (PLAYER_DATA.chargeTime > 0) {
            performAttack();
        }
    }

    // Limb Animations
    if (moveAllowed && (keys['ArrowRight'] || keys['ArrowLeft'] || keys['ArrowUp'] || keys['ArrowDown'])) {
        const time = clock.getElapsedTime() * 10;
        const limbs = playerGroup.userData.limbs;
        if (limbs) {
            limbs.armL.rotation.x = Math.sin(time) * 0.5;
            limbs.armR.rotation.x = -Math.sin(time) * 0.5;
            limbs.legL.rotation.x = -Math.sin(time) * 0.5;
            limbs.legR.rotation.x = Math.sin(time) * 0.5;
        }
    } else {
        const limbs = playerGroup.userData.limbs;
        if (limbs) {
            limbs.armL.rotation.x = 0; limbs.armR.rotation.x = 0;
            limbs.legL.rotation.x = 0; limbs.legR.rotation.x = 0;
        }
    }

    if (PLAYER_DATA.attackTimer > 0) {
        PLAYER_DATA.attackTimer--;
        const progress = (30 - PLAYER_DATA.attackTimer) / 30; // 0~1

        // 항상 월드 X축 기준으로 휘두르기
        // playerGroup이 어느 방향이든 카메라에서 보면 | → / → -- → \ 로 보임
        const angle = progress * Math.PI * 0.9;
        const worldX = new THREE.Vector3(1, 0, 0);
        const swingQuat = new THREE.Quaternion().setFromAxisAngle(worldX, angle);
        // playerGroup 회전의 역을 곱해 월드 회전을 로컬로 변환
        const parentInv = playerGroup.quaternion.clone().invert();
        swordMesh.quaternion.copy(parentInv.premultiply(swingQuat));

        // 팔도 함께
        const limbs = playerGroup.userData.limbs;
        if (limbs) {
            limbs.armL.rotation.x = progress * Math.PI * 0.5;
            limbs.armL.rotation.z = 0;
        }
    } else {
        // 기본 자세: 칼날 위로 (| 모양)
        swordMesh.quaternion.identity();
        const limbs = playerGroup.userData.limbs;
        if (limbs) {
            limbs.armL.rotation.z = 0;
            if (!(keys['ArrowRight'] || keys['ArrowLeft'] || keys['ArrowUp'] || keys['ArrowDown'])) {
                limbs.armL.rotation.x = 0;
            }
        }
    }

    enemies.forEach((en, i) => {
        // ... (existing resize logic)

        // Ghost bobbing
        if (en.userData.type === 'ghost') {
            en.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
        }
        if (en.userData.spawnScale < en.userData.targetScale) {
            en.userData.spawnScale += 0.08;
            if (en.userData.spawnScale > en.userData.targetScale) en.userData.spawnScale = en.userData.targetScale;
            let s = en.userData.spawnScale;
            en.scale.set(s, s, s);
        }

        const dist = en.position.distanceTo(playerGroup.position);
        const eyeL = en.getObjectByName("eyeL");
        const eyeR = en.getObjectByName("eyeR");

        // 주인공을 향해 고개 돌리기 (공격 방향 정렬)
        en.lookAt(playerGroup.position.x, en.position.y, playerGroup.position.z);

        const baseScale = en.userData.targetScale;
        // 보스와 일반 몬스터의 크기를 고려한 정지 거리 계산
        let stopDist = en.userData.isBoss ? (4 * en.userData.sizeFactor) : (1.2 * en.userData.sizeFactor);

        if (en.userData.hitFlash > 0) {
            en.userData.state = 'hurt';
            en.userData.hitFlash--;
            if (eyeL) eyeL.scale.set(1.5, 0.2, 1);
            if (eyeR) eyeR.scale.set(1.5, 0.2, 1);
            en.scale.set(baseScale * 1.2, baseScale * 0.7, baseScale * 1.2);
        } else if (en.userData.attackTimer > 0) {
            // 공격 애니메이션 진행 중
            en.userData.attackTimer--;
            en.userData.state = 'attacking';
            const fist = en.getObjectByName("fist");

            if (en.userData.attackTimer > 20) {
                // 1단계: 기 모으기 (뒤로 주먹을 뺌)
                const p = (en.userData.attackTimer - 20) / 20; // 1 -> 0
                if (fist) {
                    fist.visible = true;
                    fist.position.set(0, 0.4, -0.2 * (1 - p));
                }
                en.scale.set(baseScale * (1 - 0.2 * p), baseScale * (1 + 0.3 * p), baseScale * (1 - 0.2 * p));
                if (eyeL) eyeL.material.color.set(0xffaa00);
                if (eyeR) eyeR.material.color.set(0xffaa00);
            } else if (en.userData.attackTimer === 20) {
                // 2단계: 타격 순간 (주먹을 앞으로 뻗음!)
                if (fist) {
                    fist.position.set(0, 0.4, 1.0); // 앞으로 발사

                    // 각 몬스터 타입별 공격 소리 재생
                    if (en.userData.isBoss) {
                        playSound('atk_boss');
                    } else {
                        playSound('atk_' + en.userData.type);
                    }

                    // 주먹 위치 계산
                    const fistWorldPos = new THREE.Vector3();
                    fist.getWorldPosition(fistWorldPos);

                    // 1) 주인공 데미지 판정
                    const hitDist = fistWorldPos.distanceTo(playerGroup.position);
                    if (hitDist < 1.5 * en.userData.sizeFactor && PLAYER_DATA.shieldTimer <= 0 && !PLAYER_DATA.isBlocking) {
                        PLAYER_DATA.hp -= en.userData.damage;
                        shakeCamera();
                        playSound('hit');
                    }

                    // 2) 다른 적군 데미지 판정 (팀킬 가능!)
                    enemies.forEach(other => {
                        if (other === en) return; // 자기 자신 제외
                        const otherDist = fistWorldPos.distanceTo(other.position);
                        if (otherDist < 1.2 * en.userData.sizeFactor) {
                            other.userData.hp -= en.userData.damage;
                            other.userData.hitFlash = 15;
                            // 넉백 효과
                            const knockback = new THREE.Vector3().subVectors(other.position, en.position).normalize();
                            other.position.addScaledVector(knockback, 0.5);
                        }
                    });
                }
                en.scale.set(baseScale * 1.4, baseScale * 0.8, baseScale * 1.4);
                if (eyeL) eyeL.material.color.set(0xff0000);
                if (eyeR) eyeR.material.color.set(0xff0000);
            } else {
                // 3단계: 주먹 회수 및 후딜레이
                const p = en.userData.attackTimer / 20; // 1 -> 0
                if (fist) {
                    fist.position.z = p;
                    if (en.userData.attackTimer === 1) fist.visible = false;
                }
                en.scale.set(baseScale * (1 + 0.1 * p), baseScale * (1 + 0.1 * p), baseScale * (1 + 0.1 * p));
            }
        } else if (en.userData.attackCooldown > 0) {
            en.userData.state = 'cooldown';
            en.userData.attackCooldown--;
            if (eyeL) { eyeL.scale.set(1, 1, 1); eyeL.material.color.set(0x000000); }
            if (eyeR) { eyeR.scale.set(1, 1, 1); eyeR.material.color.set(0x000000); }
            if (en.userData.spawnScale >= baseScale) en.scale.set(baseScale, baseScale, baseScale);
        } else {
            en.userData.state = 'normal';
            if (eyeL) { eyeL.scale.set(1, 1, 1); eyeL.material.color.set(0x000000); }
            if (eyeR) { eyeR.scale.set(1, 1, 1); eyeR.material.color.set(0x000000); }
            if (en.userData.spawnScale >= baseScale) en.scale.set(baseScale, baseScale, baseScale);
        }

        if (dist > stopDist && en.userData.state !== 'hurt' && en.userData.state !== 'attacking') {
            const dir = new THREE.Vector3().subVectors(playerGroup.position, en.position).normalize();
            const newX = en.position.x + dir.x * en.userData.speed;
            const newZ = en.position.z + dir.z * en.userData.speed;

            // 새로운 위치에 바닥이 있으면 이동
            if (checkGroundCollision({ x: newX, z: newZ, y: en.position.y })) {
                en.position.x = newX;
                en.position.z = newZ;
            }
        } else if (dist <= stopDist && en.userData.attackCooldown <= 0 && en.userData.state === 'normal') {
            // 트리거: 공격 시작
            en.userData.attackTimer = 40;
            en.userData.attackCooldown = 30; // 다음 공격까지의 대기 시간 (원래 80, 더 자주 공격하게 줄임)
        }

        // 땅 위에 있으면 유효 위치 갱신, 땅 밖이면 마지막 유효 위치로 복원
        if (checkGroundCollision(en.position)) {
            en.userData.lastValidX = en.position.x;
            en.userData.lastValidZ = en.position.z;
            en.position.y = 0;
        } else {
            // 낙하 대신 마지막 유효 위치로 되돌아옴
            en.position.x = en.userData.lastValidX || en.position.x;
            en.position.z = en.userData.lastValidZ || en.position.z;
            en.position.y = 0;
        }

        // 보스 체력바 업데이트
        if (en.userData.isBoss) {
            const hpBar = en.getObjectByName("hpBar");
            const hpFill = en.getObjectByName("hpFill");
            if (hpBar && hpFill) {
                const hpPercent = Math.max(0, en.userData.hp / en.userData.maxHp);
                hpFill.scale.x = hpPercent;
                // 왼쪽에서부터 줄어들도록 위치 조정 (1x1 박스 기준)
                hpFill.position.x = (hpPercent - 1) * 0.575;
                // 항상 카메라를 바라보게 (빌보드 효과)
                hpBar.quaternion.copy(camera.quaternion);
            }
        }

        if (en.userData.hp <= 0) {
            dropItem(en.position);
            PLAYER_DATA.xp += 1;
            // 스코어 계산: 기본 점수 * 사이즈 배율 (버림)
            score += Math.floor(GAME_SETTINGS.MONSTER.BASE_SCORE * en.userData.sizeFactor);
            enemiesDefeated++;
            scene.remove(en);
            enemies.splice(i, 1);
            checkLevelUp();
        }
    });

    items.forEach((it, i) => {
        if (it.position.distanceTo(playerGroup.position) < 1) {
            if (it.userData.type === 'potion') PLAYER_DATA.hp = Math.min(PLAYER_DATA.maxHp, PLAYER_DATA.hp + 30);
            if (it.userData.type === 'coin') { money += 50; score += 50; }
            scene.remove(it);
            items.splice(i, 1);
            playSound('levelup');
        }
    });

    if (Math.random() < 0.01) spawnMonster();

    document.getElementById('hp-fill').style.width = (PLAYER_DATA.hp / PLAYER_DATA.maxHp) * 100 + '%';
    document.getElementById('hp-text').innerText = `${Math.ceil(PLAYER_DATA.hp)} / ${PLAYER_DATA.maxHp}`;
    document.getElementById('money-val').innerText = money;
    document.getElementById('score-val').innerText = score;
    document.getElementById('lv-val').innerText = PLAYER_DATA.lv;
    document.getElementById('xp-val').innerText = PLAYER_DATA.xp;
    document.getElementById('next-xp-val').innerText = PLAYER_DATA.nextXp;
    let m = Math.floor(stageTime / 60), s = Math.floor(stageTime % 60);
    document.getElementById('stage-display').innerText = `Stage ${stage}`;
    document.getElementById('timer-display').innerText = `${m}:${s.toString().padStart(2, '0')}`;

    // 남은 적 = (총 적 수 - 처치한 적 수) + 현재 화면에 있는 적 수... 가 아니라
    // 스폰 방식에 따라 다름. 여기서는 총 목표 처치 수가 totalEnemiesInStage 이므로
    // 남은 적 = totalEnemiesInStage - enemiesDefeated
    let remaining = totalEnemiesInStage - enemiesDefeated;
    document.getElementById('enemy-count-display').innerText = `남은 적: ${Math.max(0, remaining)}`;

    if (PLAYER_DATA.hp <= 0) endGame("전투 불능");
    if (PLAYER_DATA.shieldTimer > 0) { PLAYER_DATA.shieldTimer--; shieldMesh.visible = true; }
    else { shieldMesh.visible = false; }

    // 스태미나 자동 회복: 1초마다 1칸
    if (PLAYER_DATA.stamina < PLAYER_DATA.maxStamina) {
        PLAYER_DATA.staminaRegenTimer++;
        if (PLAYER_DATA.staminaRegenTimer >= 60) {
            PLAYER_DATA.staminaRegenTimer = 0;
            PLAYER_DATA.stamina++;
            // 만충 시 exhausted 해제
            if (PLAYER_DATA.staminaExhausted && PLAYER_DATA.stamina >= PLAYER_DATA.maxStamina) {
                PLAYER_DATA.staminaExhausted = false;
            }
        }
    } else {
        PLAYER_DATA.staminaRegenTimer = 0;
    }

    // 스태미나 UI 업데이트 (회복 중이면 까낙기)
    for (let i = 0; i < PLAYER_DATA.maxStamina; i++) {
        const cell = document.getElementById('st' + i);
        if (cell) {
            cell.classList.toggle('empty', i >= PLAYER_DATA.stamina);
            cell.classList.toggle('recharging', PLAYER_DATA.staminaExhausted);
        }
    }

    // Tree Animation
    trees.forEach(tree => {
        if (tree.userData.shakeTimer > 0) {
            tree.userData.shakeTimer--;
            tree.rotation.z = (Math.random() - 0.5) * 0.2;
            tree.rotation.x = (Math.random() - 0.5) * 0.2;
        } else {
            tree.rotation.z = 0;
            tree.rotation.x = 0;
        }

        if (tree.userData.isOnFire) {
            const fire = tree.getObjectByName("fire");
            if (fire) {
                fire.scale.y = 1 + (Math.random() - 0.5) * 0.4;
                fire.rotation.y += 0.1;
            }
        }
    });
}

function performAttack() {
    // 스태미나 체크: 0이거나 exhausted 상태면 공격 불가
    if (PLAYER_DATA.stamina <= 0 || PLAYER_DATA.staminaExhausted) {
        PLAYER_DATA.chargeTime = 0;
        document.getElementById('charge-bar').style.display = 'none';
        return;
    }

    PLAYER_DATA.isAttacking = true;
    PLAYER_DATA.attackTimer = 30;
    PLAYER_DATA.stamina--;  // 스태미나 1칸 소모

    // 5칸 평다 전부 소진 시 exhausted 상태
    if (PLAYER_DATA.stamina <= 0) {
        PLAYER_DATA.staminaExhausted = true;
        PLAYER_DATA.staminaRegenTimer = 0; // 즐시 회복 시작
    }

    playSound('attack');

    // 칼날의 현재 스케일을 고려한 범위 계산
    let range = 2.2 * PLAYER_DATA.swordScaleY;
    let dmg = 25 * PLAYER_DATA.lv;
    let knockback = 2.0;

    if (PLAYER_DATA.chargeTime >= 60) {
        range *= 2; dmg *= 3; knockback = 5.0;
        createLightning();
        shakeCamera();
    }

    enemies.forEach(en => {
        let isHit = false;
        if (en.position.distanceTo(playerGroup.position) < range) {
            let dx = en.position.x - playerGroup.position.x;
            let dz = en.position.z - playerGroup.position.z;
            let dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 0.01) {
                dx /= dist;
                dz /= dist;
            } else {
                dx = 1; dz = 0;
            }

            let pDirX = PLAYER_DATA.dirX !== undefined ? PLAYER_DATA.dirX : 1;
            let pDirZ = PLAYER_DATA.dirZ !== undefined ? PLAYER_DATA.dirZ : 0;

            let dot = dx * pDirX + dz * pDirZ;
            if (dot > -0.2) {
                isHit = true;
            }
        }

        if (isHit) {
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

    // Check Tree Hits
    trees.forEach((tree, index) => {
        let isHit = false;
        if (tree.position.distanceTo(playerGroup.position) < range * 0.8) {
            let dx = tree.position.x - playerGroup.position.x;
            let dz = tree.position.z - playerGroup.position.z;
            let dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 0.01) {
                dx /= dist;
                dz /= dist;
            } else {
                dx = 1; dz = 0;
            }

            let pDirX = PLAYER_DATA.dirX !== undefined ? PLAYER_DATA.dirX : 1;
            let pDirZ = PLAYER_DATA.dirZ !== undefined ? PLAYER_DATA.dirZ : 0;

            let dot = dx * pDirX + dz * pDirZ;
            if (dot > -0.2) {
                isHit = true;
            }
        }

        if (isHit) {
            playSound('tree_hit');
            tree.userData.shakeTimer = 10;
            tree.userData.hp--;

            // Fire Effect (HP <= 10)
            if (tree.userData.hp <= 10 && !tree.userData.isOnFire) {
                tree.userData.isOnFire = true;
                const fireGeo = new THREE.ConeGeometry(0.5, 1, 8);
                const fireMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
                const fire = new THREE.Mesh(fireGeo, fireMat);
                fire.position.y = 1.5;
                fire.name = "fire";
                tree.add(fire);
            }

            // Explosion (HP <= 0)
            if (tree.userData.hp <= 0) {
                createExplosion(tree.position);
                playSound('explosion');
                scene.remove(tree);
                trees.splice(index, 1);
            }
        }
    });

}

function createExplosion(pos) {
    // Visual
    const geo = new THREE.SphereGeometry(2, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffa500 });
    const explosion = new THREE.Mesh(geo, mat);
    explosion.position.copy(pos);
    scene.add(explosion);

    // Scale up and fade out
    let scale = 1;
    let opacity = 1;
    const interval = setInterval(() => {
        scale += 0.2;
        opacity -= 0.1;
        explosion.scale.set(scale, scale, scale);
        // explosion.material.opacity = opacity; // BasicMaterial doesn't support alpha without transport, simplifed: just scale
        if (opacity <= 0) {
            clearInterval(interval);
            scene.remove(explosion);
        }
    }, 50);

    // Damage Area
    const explosionRadius = 10;
    const explosionDamage = 10;

    // Player Damage
    if (playerGroup.position.distanceTo(pos) < explosionRadius) {
        if (!PLAYER_DATA.isBlocking && PLAYER_DATA.shieldTimer <= 0) {
            PLAYER_DATA.hp -= explosionDamage;
            playSound('hit');
            shakeCamera();
        }
    }

    // Enemy Damage
    enemies.forEach((en, i) => {
        if (en.position.distanceTo(pos) < explosionRadius) {
            en.userData.hp -= explosionDamage * 3; // Bonus damage to monsters
            en.userData.hitFlash = 30;
            // Push away
            const pushDir = new THREE.Vector3().subVectors(en.position, pos).normalize();
            en.position.x += pushDir.x * 5;
            en.position.z += pushDir.z * 5;

            if (en.userData.hp <= 0) {
                dropItem(en.position);
                PLAYER_DATA.xp += 1;
                score += Math.floor(GAME_SETTINGS.MONSTER.BASE_SCORE * en.userData.sizeFactor);
                enemiesDefeated++;
                scene.remove(en);
                enemies.splice(i, 1);
                checkLevelUp();
            }
        }
    });
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
    // 아이템 드랍 확률 체크 (50%)
    if (Math.random() > GAME_SETTINGS.ITEM.DROP_RATE) return;

    // 포션 드랍 확률 계산 (스테이지 진행에 따라 감소)
    let potionChance = Math.max(0.1, GAME_SETTINGS.ITEM.POTION_RATE - (stage - 1) * GAME_SETTINGS.ITEM.POTION_DECAY);

    const type = Math.random() < potionChance ? 'potion' : 'coin';
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

        // 레벨업 시 최대 체력 10% 증가
        PLAYER_DATA.maxHp = Math.floor(PLAYER_DATA.maxHp * 1.1);
        PLAYER_DATA.hp = PLAYER_DATA.maxHp;

        PLAYER_DATA.shieldTimer = 300;
        playSound('levelup');
        createLightning();

        // Level-based Visual Evolution
        const head = playerGroup.userData.head;
        const torso = playerGroup.userData.torso;

        switch (PLAYER_DATA.lv) {
            case 2:
                // Horns
                const hornMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
                const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), hornMat);
                hornL.position.set(0.3, 0.4, 0); head.add(hornL);
                const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), hornMat);
                hornR.position.set(-0.3, 0.4, 0); head.add(hornR);
                break;
            case 4:
                // Shoulder Pads (Pauldrons)
                const padMat = new THREE.MeshPhongMaterial({ color: 0xffd700 });
                const padL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.5), padMat);
                padL.position.set(0.45, 0.4, 0); playerGroup.add(padL);
                const padR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.5), padMat);
                padR.position.set(-0.45, 0.4, 0); playerGroup.add(padR);
                break;
            case 6:
                // Wings (Simple Voxel style)
                const wingMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
                const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), wingMat);
                wingL.position.set(0.6, 0.8, -0.3); wingL.rotation.y = 0.5; playerGroup.add(wingL);
                const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), wingMat);
                wingR.position.set(-0.6, 0.8, -0.3); wingR.rotation.y = -0.5; playerGroup.add(wingR);
                break;
            case 8:
                // Glowing Eyes (Red)
                head.children.forEach(c => {
                    if (c.material && c.material.color.getHex() === 0x000000) {
                        c.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    }
                });
                break;
            case 10:
                // Golden Crown
                const crownMat = new THREE.MeshPhongMaterial({ color: 0xffd700 });
                const crown = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.4), crownMat);
                crown.position.y = 0.4; head.add(crown);
                // Also give torso a golden trim
                torso.material.color.set(0x0044ff); // Royal Blue
                break;
        }
    }
}

function buyWeapon(type, cost) {
    if (money >= cost) {
        money -= cost;
        PLAYER_DATA.weapon = type;
        if (type === 'axe') swordMesh.scale.set(4, 1, 4);
        if (type === 'legend') swordMesh.material.color.set(0x00ffff);
        alert("새로운 무기를 장착했습니다!");
        document.getElementById('money-val').innerText = money;
    } else alert("돈이 부족합니다!");
}

function buyUpgrade(type) {
    const data = UPGRADE_DATA[type];
    if (money >= data.cost) {
        money -= data.cost;
        data.level++;
        data.cost += data.costInc;

        switch (type) {
            case 'swordLength':
                // 칼 날 길이 30% 증가
                PLAYER_DATA.swordScaleY *= 1.3;
                const blade = swordMesh.getObjectByName("blade");
                if (blade) {
                    blade.scale.y = PLAYER_DATA.swordScaleY;
                    blade.position.y = (PLAYER_DATA.swordScaleY - 1) * 0.5; // Offset position so it grows from the guard
                }
                break;
            case 'moveSpeed':
                // 이동 속도 5% 증가
                PLAYER_DATA.speed *= 1.05;
                break;
            case 'jumpPower':
                // 점프력(높이) 및 체공시간(길이) 10% 증가
                // 점프 초기 속도(높이) 증가
                PLAYER_DATA.jumpMaxV *= 1.1;
                // 중력 감소 (체공 시간 증가 -> 점프 길이 증가 효과)
                // 중력을 줄이면 같은 V0여도 더 높이, 더 오래 떠 있음
                break;
        }

        // Update UI
        document.getElementById('money-val').innerText = money;
        updateShopUI();
        playSound('levelup');
    } else {
        alert("돈이 부족합니다!");
    }
}

function updateShopUI() {
    const btnSword = document.getElementById('btn-upgrade-sword');
    const btnSpeed = document.getElementById('btn-upgrade-speed');
    const btnJump = document.getElementById('btn-upgrade-jump');

    if (btnSword) btnSword.innerText = `💰 ${UPGRADE_DATA.swordLength.cost} (Lv.${UPGRADE_DATA.swordLength.level})`;
    if (btnSpeed) btnSpeed.innerText = `💰 ${UPGRADE_DATA.moveSpeed.cost} (Lv.${UPGRADE_DATA.moveSpeed.level})`;
    if (btnJump) btnJump.innerText = `💰 ${UPGRADE_DATA.jumpPower.cost} (Lv.${UPGRADE_DATA.jumpPower.level})`;
}

function nextStage() {
    stage++;
    stageTime = 120;
    totalEnemiesInStage = 10 + (stage - 1) * 5; // Adjust difficulty curve if needed
    enemiesDefeated = 0;
    bossSpawned = false;

    // Clear World
    groundShapes.forEach(g => scene.remove(g));
    groundShapes = [];
    groundMeshes = [];

    trees.forEach(t => scene.remove(t));
    trees = [];

    enemies.forEach(e => scene.remove(e));
    enemies = [];

    items.forEach(i => scene.remove(i));
    items = [];

    // Reset Player Position
    playerGroup.position.set(0, 0, 0);
    PLAYER_DATA.isJumping = false;
    PLAYER_DATA.jumpV = 0;
    PLAYER_DATA.isFalling = false;

    // Regenerate World
    initConsonantWorlds();

    document.getElementById('shop-ui').style.display = 'none';
    gameActive = true;
}

function spawnBoss() {
    playSound('boss_intro');

    const boss = new THREE.Group();
    // 주인공(0.8x1.0x0.5)과 비슷한 느낌의 기본 크기를 위해 1x1x1 박스 사용
    // 스테이지 1에선 1.5배(주인공보다 약간 큼), 이후 0.5배씩 성장
    const bossSize = 1.5 + (stage - 1) * 0.5;

    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
    body.position.y = 0.5;
    body.castShadow = true;
    boss.add(body);

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeL.position.set(0.25, 0.7, 0.51); eyeL.name = "eyeL"; boss.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeR.position.set(-0.25, 0.7, 0.51); eyeR.name = "eyeR"; boss.add(eyeR);

    // 보스 전용 체력바 추가
    const hpBarGroup = new THREE.Group();
    hpBarGroup.name = "hpBar";

    const hpBgGeo = new THREE.BoxGeometry(1.2, 0.15, 0.05);
    const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
    hpBarGroup.add(hpBg);

    const hpFillGeo = new THREE.BoxGeometry(1.15, 0.1, 0.06);
    const hpFillMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const hpFill = new THREE.Mesh(hpFillGeo, hpFillMat);
    hpFill.name = "hpFill";
    hpBarGroup.add(hpFill);

    hpBarGroup.position.set(0, 1.5, 0); // 몸통 위에 위치
    boss.add(hpBarGroup);

    // Fist (Punch) for Boss
    const fist = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), new THREE.MeshPhongMaterial({ color: 0x880000 }));
    fist.name = "fist";
    fist.visible = false;
    boss.add(fist);

    // 플레이어 근처에 소환
    boss.position.set(playerGroup.position.x + 15, 0, playerGroup.position.z);
    boss.scale.set(bossSize, bossSize, bossSize);

    boss.userData = {
        // 보스는 일반 몬스터 대비 2배(Stage 1)에서 시작하여 스테이지마다 1배씩 증가
        // (1 + stage) 배율 적용, 기본 수치 300 -> 150으로 난이도 더 하향
        hp: 150 * (1 + stage) * bossSize, maxHp: 150 * (1 + stage) * bossSize, isBoss: true,
        speed: 0.02, attackTimer: 0, attackCooldown: 0, hitFlash: 0, state: 'normal',
        spawnScale: bossSize, targetScale: bossSize, sizeFactor: bossSize,
        damage: GAME_SETTINGS.MONSTER.BASE_DAMAGE * bossSize * 0.8 // 데미지 보정 하향
    };
    scene.add(boss);
    enemies.push(boss);
}

function shakeCamera() {
    const originalY = camera.position.y;
    let count = 0;
    const interval = setInterval(() => {
        camera.position.y = originalY + (Math.random() - 0.5) * 0.6;
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
window.buyUpgrade = buyUpgrade; // Add this
window.nextStage = nextStage;


console.log("✅ Global functions bound", { initGame: typeof window.initGame, buyWeapon: typeof window.buyWeapon, nextStage: typeof window.nextStage });
