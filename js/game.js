/**
 * Forest Hero 3D - Main Game Logic v1.5
 * Updates:
 * - Debug UI integration (Speed, Jump, Attack rate)
 * - Improved Eye positioning for visibility
 */

console.log("Game Script Loaded v1.5");

// --- 디버그 설정 ---
const debugSettings = {
    enemySpeedMult: 1,
    jumpForce: 12,
    attackSpeedMult: 1
};

// --- 사운드 시스템 ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    try {
        switch(type) {
            case 'jump': 
                osc.type = 'square'; 
                osc.frequency.setValueAtTime(200, now); 
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.1); 
                gain.gain.setValueAtTime(0.05, now); 
                osc.start(); osc.stop(now + 0.1); 
                break;
            case 'attack': 
                osc.type = 'sawtooth'; 
                osc.frequency.setValueAtTime(400, now); 
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1); 
                gain.gain.setValueAtTime(0.05, now); 
                osc.start(); osc.stop(now + 0.1); 
                break;
            case 'hit': 
                osc.type = 'sine'; 
                osc.frequency.setValueAtTime(100, now); 
                gain.gain.setValueAtTime(0.1, now); 
                osc.start(); osc.stop(now + 0.05); 
                break;
            case 'levelup': 
                [440, 554, 659].forEach((f, i) => { 
                    const o = audioCtx.createOscillator(); 
                    const g = audioCtx.createGain(); 
                    o.type = 'sine'; o.connect(g); g.connect(audioCtx.destination); 
                    o.frequency.setValueAtTime(f, now + i*0.1); 
                    g.gain.setValueAtTime(0.05, now + i*0.1); 
                    o.start(now + i*0.1); o.stop(now + i*0.1 + 0.1); 
                }); 
                break;
            case 'spawn': 
                osc.type = 'sine'; 
                osc.frequency.setValueAtTime(600, now); 
                osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1); 
                gain.gain.setValueAtTime(0.05, now); 
                osc.start(); osc.stop(now + 0.1); 
                break;
        }
    } catch(e) {}
}

// --- 전역 변수 ---
let scene, camera, renderer, clock, world;
let playerGroup, swordMesh, shieldMesh;
let trees = [], enemies = [], items = [], projectiles = [], particles = [];
let gameActive = false;
let stage = 1;
let stageTime = 60;
let money = 0;
const keys = {};

let totalEnemiesInStage = 10;
let enemiesSpawned = 0;
let enemiesDefeated = 0;

const PLAYER_DATA = {
    hp: 100, maxHp: 100, lv: 1, xp: 0, nextXp: 5,
    speed: 0.15, direction: 1, isAttacking: false, 
    attackTimer: 0, chargeTime: 0, shieldTimer: 0,
    isFalling: false, body: null, weapon: 'sword'
};

const WORLD_WIDTH_Z = 8;

// --- 물리 초기화 ---
function initPhysics() {
    if (typeof CANNON === 'undefined') {
        alert("물리 엔진 로딩 실패! 새로고침 해주세요.");
        return;
    }
    world = new CANNON.World();
    world.gravity.set(0, -20, 0); 
    world.broadphase = new CANNON.NaiveBroadphase();
    
    const groundBody = new CANNON.Body({
        mass: 0, 
        shape: new CANNON.Box(new CANNON.Vec3(1000, 0.5, WORLD_WIDTH_Z / 2))
    });
    groundBody.position.y = -0.5;
    world.addBody(groundBody);
}

// --- 게임 초기화 ---
function initGame() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // 디버그 UI 이벤트 리스너 연결
    setupDebugListeners();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    camera = new THREE.PerspectiveCamera(60, 1024 / 768, 0.1, 1000);
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1024, 768);
    renderer.shadowMap.enabled = true;
    
    const container = document.getElementById('game-container');
    if (container.querySelector('canvas')) container.removeChild(container.querySelector('canvas'));
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 10, 5);
    light.castShadow = true;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x606060));

    // 바닥 시각화
    const groundMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2000, 1, WORLD_WIDTH_Z),
        new THREE.MeshPhongMaterial({ color: 0x44aa44 })
    );
    groundMesh.position.y = -0.5;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    initPhysics();
    createPlayer();
    initTrees();
    
    // 게임 리셋
    stage = 1; stageTime = 60; 
    totalEnemiesInStage = 10; enemiesSpawned = 0; enemiesDefeated = 0;
    
    clock = new THREE.Clock();
    gameActive = true;
    animate();
    
    window.addEventListener('keydown', e => { 
        keys[e.code] = true; 
        if(["ArrowUp","ArrowDown","Space"].includes(e.code)) e.preventDefault(); 
    });
    window.addEventListener('keyup', e => keys[e.code] = false);
}

function setupDebugListeners() {
    const speedInput = document.getElementById('dbg-enemy-speed');
    const jumpInput = document.getElementById('dbg-jump-height');
    const attackInput = document.getElementById('dbg-attack-speed');

    if (speedInput) speedInput.addEventListener('input', (e) => debugSettings.enemySpeedMult = parseFloat(e.target.value));
    if (jumpInput) jumpInput.addEventListener('input', (e) => debugSettings.jumpForce = parseFloat(e.target.value));
    if (attackInput) attackInput.addEventListener('input', (e) => debugSettings.attackSpeedMult = parseFloat(e.target.value));
}

function createPlayer() {
    playerGroup = new THREE.Group();
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.5), new THREE.MeshPhongMaterial({ color: 0x1e90ff }));
    bodyMesh.position.y = 0.5; bodyMesh.castShadow = true; playerGroup.add(bodyMesh);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshPhongMaterial({ color: 0xffdbac }));
    head.position.y = 1.3; playerGroup.add(head);

    // 눈 추가 (앞으로 조금 더 튀어나오게 z값 조정)
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeL.position.set(0.15, 1.4, 0.32); // z: 0.3 -> 0.32
    playerGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeR.position.set(-0.15, 1.4, 0.32);
    playerGroup.add(eyeR);

    const swordGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
    const swordMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
    swordMesh = new THREE.Mesh(swordGeo, swordMat);
    swordMesh.position.set(0.6, 0.8, 0); playerGroup.add(swordMesh);

    const shape = new CANNON.Box(new CANNON.Vec3(0.4, 0.8, 0.25));
    PLAYER_DATA.body = new CANNON.Body({ mass: 5, shape: shape, fixedRotation: true });
    PLAYER_DATA.body.position.set(0, 2, 0); 
    world.addBody(PLAYER_DATA.body);

    scene.add(playerGroup);
}

function initTrees() {
    trees = [];
    for(let i=0; i<40; i++) {
        const tree = createTreeMesh();
        tree.position.set(Math.random()*400 - 200, 0, (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random()*4));
        scene.add(tree);
        trees.push(tree);
    }
}

function createTreeMesh() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.4), new THREE.MeshPhongMaterial({ color: 0x5c4033 }));
    trunk.position.y = 0.75; g.add(trunk);
    const leaves = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshPhongMaterial({ color: 0x228b22 }));
    leaves.position.y = 2; g.add(leaves);
    return g;
}

function createEnemyHPBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 8;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(1.5, 0.2, 1);
    sprite.userData = { canvas, ctx, texture };
    return sprite;
}

function updateEnemyHPBar(sprite, current, max) {
    const { canvas, ctx, texture } = sprite.userData;
    ctx.fillStyle = '#444'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const ratio = Math.max(0, current / max);
    ctx.fillStyle = ratio > 0.5 ? '#00ff00' : '#ff0000';
    ctx.fillRect(0, 0, ratio * canvas.width, canvas.height);
    texture.needsUpdate = true;
}

function spawnMonster(isBoss = false) {
    if (!isBoss && (enemiesSpawned >= totalEnemiesInStage || enemies.length > 8)) return;

    const enGroup = new THREE.Group();
    let size = isBoss ? 3 : 0.8;
    let color = isBoss ? 0xff0044 : (Math.random() > 0.5 ? 0x55ff55 : 0xeeeeee);
    const type = isBoss ? 'boss' : (Math.random() > 0.7 ? 'skeleton' : 'wolf');
    
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshPhongMaterial({ color }));
    bodyMesh.position.y = size / 2; enGroup.add(bodyMesh);
    
    // 적 눈 추가 (더 잘 보이게 z값 조정)
    const eyeZ = size/2 + 0.05; // 몸통보다 약간 앞
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeL.position.set(0.2, size*0.7, eyeZ);
    eyeL.name = "eyeL"; enGroup.add(eyeL);
    
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeR.position.set(-0.2, size*0.7, eyeZ);
    eyeR.name = "eyeR"; enGroup.add(eyeR);

    const hpBar = createEnemyHPBar();
    hpBar.position.y = size + 0.8; enGroup.add(hpBar);

    const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
    const body = new CANNON.Body({ mass: isBoss ? 200 : 2, shape: shape, fixedRotation: true });
    body.position.set(playerGroup.position.x + (Math.random() > 0.5 ? 15 : -15), 5, Math.random()*6 - 3);
    world.addBody(body);

    // 속도 2배 증가
    let baseSpeed = 0.03;
    if (type === 'wolf') baseSpeed = 0.06;
    let speed = (baseSpeed + Math.random() * baseSpeed) * 2;

    enGroup.userData = { 
        hp: (isBoss ? 1500 : 40) * stage, maxHp: (isBoss ? 1500 : 40) * stage, 
        body, hpBar, isBoss, hitFlash: 0, isFalling: false,
        type: type, 
        speed: speed 
    };
    
    playSound('spawn');
    scene.add(enGroup);
    enemies.push(enGroup);
    if (!isBoss) enemiesSpawned++;
}

// --- 메인 업데이트 루프 ---
function update() {
    if (!gameActive) return;

    world.step(1/60);
    playerGroup.position.copy(PLAYER_DATA.body.position);

    if (!PLAYER_DATA.isFalling) {
        if (stageTime > 0) {
            stageTime -= 1/60;
            if (Math.random() < 0.02) spawnMonster();
        }
        if (enemiesSpawned >= totalEnemiesInStage && enemies.length === 0) {
            spawnMonster(true);
        }
    }

    // 캐릭터 속도 24로 증가
    let moveAllowed = !PLAYER_DATA.isBlocking && PLAYER_DATA.attackTimer < 15;
    if (moveAllowed && !PLAYER_DATA.isFalling) {
        const moveSpeed = 24; 
        if (keys['ArrowRight']) { PLAYER_DATA.body.velocity.x = moveSpeed; PLAYER_DATA.direction = 1; playerGroup.rotation.y = 0; }
        else if (keys['ArrowLeft']) { PLAYER_DATA.body.velocity.x = -moveSpeed; PLAYER_DATA.direction = -1; playerGroup.rotation.y = Math.PI; }
        else PLAYER_DATA.body.velocity.x *= 0.9;

        if (keys['ArrowUp']) PLAYER_DATA.body.velocity.z = -moveSpeed * 0.7;
        else if (keys['ArrowDown']) PLAYER_DATA.body.velocity.z = moveSpeed * 0.7;
        else PLAYER_DATA.body.velocity.z *= 0.9;
    }

    // 점프 (디버그 슬라이더 값 반영)
    if (keys['Space'] && Math.abs(PLAYER_DATA.body.velocity.y) < 0.1 && !PLAYER_DATA.isFalling) {
        PLAYER_DATA.body.velocity.y = debugSettings.jumpForce;
        playSound('jump');
    }

    if (Math.abs(PLAYER_DATA.body.position.z) > WORLD_WIDTH_Z / 2 + 0.5) PLAYER_DATA.isFalling = true;
    if (PLAYER_DATA.body.position.y < -10) endGame(PLAYER_DATA.isFalling ? "낙상" : "전투 불능");

    camera.position.x = playerGroup.position.x;

    PLAYER_DATA.isBlocking = keys['KeyX'];
    if (keys['KeyZ'] && !PLAYER_DATA.isBlocking) {
        PLAYER_DATA.chargeTime++;
        const cb = document.getElementById('charge-bar');
        const cf = document.getElementById('charge-fill');
        if (cb) cb.style.display = 'block';
        if (cf) cf.style.width = Math.min(100, (PLAYER_DATA.chargeTime/60)*100) + '%';
    } else if (PLAYER_DATA.chargeTime > 0) performAttack();

    if (PLAYER_DATA.attackTimer > 0) {
        PLAYER_DATA.attackTimer--;
        swordMesh.rotation.z = Math.sin(PLAYER_DATA.attackTimer * 0.5) * 2;
    }

    // 몬스터 루프
    const boss = enemies.find(e => e.userData.isBoss);

    for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        const data = en.userData;
        
        en.position.copy(data.body.position);
        en.quaternion.copy(data.body.quaternion);
        updateEnemyHPBar(data.hpBar, data.hp, data.maxHp);

        if (Math.abs(data.body.position.z) > WORLD_WIDTH_Z / 2 + 1) data.isFalling = true;
        if (data.isFalling && data.body.position.y < -10) {
            world.removeBody(data.body); scene.remove(en); enemies.splice(i, 1);
            if (!data.isBoss) enemiesDefeated++;
            continue;
        }

        if (boss && !data.isBoss) {
            const dist = en.position.distanceTo(boss.position);
            if (dist < 4) {
                const push = data.body.position.vsub(boss.userData.body.position); 
                push.normalize();
                data.body.velocity.x += push.x * 5;
                data.body.velocity.z += push.z * 5;
            }
        }

        if (!data.isFalling && data.hitFlash <= 0) {
            const dist = en.position.distanceTo(playerGroup.position);
            
            // 몬스터 AI: 디버그 슬라이더 값(enemySpeedMult) 반영
            let effectiveSpeed = data.speed * 100 * debugSettings.enemySpeedMult;

            if (data.type === 'skeleton') {
                 if (dist > 7) {
                    const dir = new THREE.Vector3().subVectors(playerGroup.position, en.position).normalize();
                    data.body.velocity.x = dir.x * effectiveSpeed;
                    data.body.velocity.z = dir.z * effectiveSpeed;
                } else if (dist < 5) {
                    const dir = new THREE.Vector3().subVectors(en.position, playerGroup.position).normalize();
                    data.body.velocity.x = dir.x * effectiveSpeed;
                    data.body.velocity.z = dir.z * effectiveSpeed;
                }
            } else {
                if (dist > (data.isBoss ? 4 : 1.5)) {
                    const dir = new THREE.Vector3().subVectors(playerGroup.position, en.position).normalize();
                    if (data.isBoss) effectiveSpeed *= 0.5;
                    data.body.velocity.x = dir.x * effectiveSpeed;
                    data.body.velocity.z = dir.z * effectiveSpeed;
                } else {
                    if (PLAYER_DATA.shieldTimer <= 0 && !PLAYER_DATA.isBlocking) {
                        PLAYER_DATA.hp -= (data.isBoss ? 0.6 : 0.2);
                        if (Math.random() < 0.01) { shakeCamera(); playSound('hit'); }
                    }
                }
            }
        }
        if (data.hitFlash > 0) data.hitFlash--;

        if (data.hp <= 0) {
            world.removeBody(data.body); scene.remove(en); enemies.splice(i, 1);
            if (data.isBoss) { 
                gameActive = false; 
                document.getElementById('shop-ui').style.display = 'flex'; 
            } else { 
                enemiesDefeated++; 
                money += 25; 
                PLAYER_DATA.xp += 1;
                checkLevelUp(); 
            }
        }
    }

    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it.position.distanceTo(playerGroup.position) < 1) {
            if (it.userData.type === 'potion') PLAYER_DATA.hp = Math.min(PLAYER_DATA.maxHp, PLAYER_DATA.hp + 30);
            if (it.userData.type === 'coin') money += 50;
            scene.remove(it); items.splice(i, 1); playSound('levelup');
        }
    }

    updateUI();
}

function updateUI() {
    const hpFill = document.getElementById('hp-fill');
    if (hpFill) hpFill.style.width = Math.max(0, PLAYER_DATA.hp) + '%';
    document.getElementById('money-val').innerText = money;
    document.getElementById('lv-val').innerText = PLAYER_DATA.lv;
    document.getElementById('xp-val').innerText = PLAYER_DATA.xp;
    document.getElementById('next-xp-val').innerText = PLAYER_DATA.nextXp;
    
    const timer = document.getElementById('timer');
    if (timer) {
        let m = Math.floor(Math.max(0, stageTime)/60);
        let s = Math.floor(Math.max(0, stageTime)%60);
        let rem = Math.max(0, totalEnemiesInStage - enemiesSpawned + enemies.length);
        if (enemiesSpawned >= totalEnemiesInStage) rem = enemies.length;
        timer.innerText = `Stage ${stage} - ${m}:${s.toString().padStart(2,'0')} | 남은 적: ${rem}`;
    }
}

function performAttack() {
    // 공격 속도 슬라이더 반영 (높을수록 쿨타임 감소)
    PLAYER_DATA.isAttacking = true; 
    PLAYER_DATA.attackTimer = 30 / debugSettings.attackSpeedMult; 
    playSound('attack');
    
    let range = 2.5; let pushForce = 20; let dmg = 35 * PLAYER_DATA.lv;

    if (PLAYER_DATA.chargeTime >= 60) { range *= 2; pushForce *= 3; dmg *= 3; shakeCamera(); createLightning(); }

    enemies.forEach(en => {
        if (en.position.distanceTo(playerGroup.position) < range) {
            en.userData.hp -= dmg;
            en.userData.hitFlash = 20;
            const dir = en.userData.body.position.vsub(PLAYER_DATA.body.position);
            dir.normalize();
            en.userData.body.velocity.set(dir.x * pushForce, 10, dir.z * pushForce); 
            playSound('hit');
        }
    });
    PLAYER_DATA.chargeTime = 0; 
    const cb = document.getElementById('charge-bar');
    if (cb) cb.style.display = 'none';
}

function createLightning() {
    const geo = new THREE.CylinderGeometry(0.2, 1, 20, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const l = new THREE.Mesh(geo, mat);
    l.position.set(playerGroup.position.x, 10, playerGroup.position.z);
    scene.add(l); setTimeout(() => scene.remove(l), 150);
}

function checkLevelUp() {
    if (PLAYER_DATA.xp >= PLAYER_DATA.nextXp) {
        PLAYER_DATA.lv++; 
        PLAYER_DATA.xp = 0; 
        PLAYER_DATA.nextXp *= 2;
        PLAYER_DATA.hp = PLAYER_DATA.maxHp; PLAYER_DATA.shieldTimer = 300;
        playSound('levelup');
    }
}

function buyWeapon(type, cost) {
    if (money >= cost) { 
        money -= cost; PLAYER_DATA.weapon = type; 
        if (type === 'axe') swordMesh.scale.set(4, 0.5, 4);
        alert("장비 업그레이드 완료!"); 
    } else alert("돈이 부족합니다!");
}

function nextStage() {
    stage++; stageTime = 60; 
    totalEnemiesInStage *= 2; 
    enemiesSpawned = 0; enemiesDefeated = 0;
    const shopUi = document.getElementById('shop-ui');
    if (shopUi) shopUi.style.display = 'none';
    gameActive = true;
}

function shakeCamera() {
    const originalY = camera.position.y;
    let count = 0;
    const interval = setInterval(() => {
        camera.position.y = originalY + (Math.random()-0.5)*0.5;
        if (++count > 10) { clearInterval(interval); camera.position.y = originalY; }
    }, 30);
}

function endGame(reason) {
    gameActive = false;
    const ft = document.getElementById('fail-title');
    const fm = document.getElementById('fail-msg');
    const go = document.getElementById('game-over');
    if (ft) ft.innerText = reason === "낙상" ? "추락 주의!" : "GAME OVER";
    if (go) go.style.display = 'flex';
}

function animate() {
    if (!gameActive) { if (renderer) renderer.render(scene, camera); requestAnimationFrame(animate); return; }
    update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

window.initGame = initGame; 
window.buyWeapon = buyWeapon; 
window.nextStage = nextStage;
