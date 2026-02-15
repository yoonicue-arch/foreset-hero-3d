/**
 * Forest Hero 3D - Main Game Logic
 * Using Three.js (WebGL)
 */

// --- Sound System ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
let scene, camera, renderer, clock;
let playerGroup, swordMesh, shieldMesh;
let trees = [], enemies = [], items = [], projectiles = [];
let gameActive = false;
let stage = 1;
let stageTime = 300;
let money = 0;
const keys = {};

const PLAYER_DATA = {
    x: 0, y: 0, z: 0,
    hp: 100, maxHp: 100, lv: 1, xp: 0, nextXp: 5,
    speed: 0.15, jumpV: 0, isJumping: false,
    isAttacking: false, attackTimer: 0, chargeTime: 0,
    weapon: 'sword', direction: 1, shieldTimer: 0,
    isFalling: false
};

const WORLD_WIDTH_Z = 8;

function initGame() {
    document.getElementById('start-screen').style.display = 'none';
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    camera = new THREE.PerspectiveCamera(60, 1024 / 768, 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1024, 768);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    light.castShadow = true;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Ground
    const groundGeo = new THREE.BoxGeometry(2000, 1, WORLD_WIDTH_Z);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x44aa44 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    createPlayer();
    initTrees();
    
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

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeL.position.set(0.15, 1.4, 0.3);
    playerGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyeR.position.set(-0.15, 1.4, 0.3);
    playerGroup.add(eyeR);

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

function initTrees() {
    for(let i=0; i<40; i++) {
        const tree = createTreeMesh();
        tree.position.set(Math.random()*200 - 100, 0, (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random()*5));
        scene.add(tree);
        trees.push(tree);
    }
}

function createTreeMesh() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), new THREE.MeshPhongMaterial({ color: 0x3e2716 }));
    trunk.position.y = 0.5;
    g.add(trunk);
    const leaves = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 1.5), new THREE.MeshPhongMaterial({ color: 0x234d20 }));
    leaves.position.y = 2;
    g.add(leaves);
    return g;
}

function spawnMonster() {
    if (enemies.length > 5) return;
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

    en.position.set(playerGroup.position.x + (Math.random() > 0.5 ? 12 : -12), 0, Math.random()*6 - 3);
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
        if (stageTime <= 0) spawnBoss();
    }

    if (Math.abs(playerGroup.position.z) > WORLD_WIDTH_Z / 2 + 0.5) {
        PLAYER_DATA.isFalling = true;
        document.getElementById('fall-alert').style.display = 'block';
    } else {
        document.getElementById('fall-alert').style.display = 'none';
    }

    if (PLAYER_DATA.isFalling) {
        playerGroup.position.y -= 0.15;
        if (playerGroup.position.y < -15) endGame("낙상");
        return;
    }

    let moveAllowed = !PLAYER_DATA.isBlocking && PLAYER_DATA.attackTimer < 15;
    if (moveAllowed) {
        if (keys['ArrowRight']) { playerGroup.position.x += PLAYER_DATA.speed; PLAYER_DATA.direction = 1; playerGroup.rotation.y = 0; }
        if (keys['ArrowLeft']) { playerGroup.position.x -= PLAYER_DATA.speed; PLAYER_DATA.direction = -1; playerGroup.rotation.y = Math.PI; }
        if (keys['ArrowUp']) playerGroup.position.z -= PLAYER_DATA.speed * 0.7;
        if (keys['ArrowDown']) playerGroup.position.z += PLAYER_DATA.speed * 0.7;
    }

    camera.position.x = playerGroup.position.x;

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
            en.position.x += dir.x * en.userData.speed;
            en.position.z += dir.z * en.userData.speed;
        } else if (en.userData.attackCooldown <= 0 && en.userData.state !== 'hurt') {
            en.userData.attackCooldown = 100;
            if (PLAYER_DATA.shieldTimer <= 0 && !PLAYER_DATA.isBlocking) {
                PLAYER_DATA.hp -= 12;
                shakeCamera();
                playSound('hit');
            }
        }
        if (en.userData.attackCooldown > 0) en.userData.attackCooldown--;

        if (en.userData.hp <= 0) {
            dropItem(en.position);
            PLAYER_DATA.xp += 2;
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

function checkLevelUp() {
    if (PLAYER_DATA.xp >= PLAYER_DATA.nextXp) {
        PLAYER_DATA.lv++;
        PLAYER_DATA.xp = 0;
        PLAYER_DATA.nextXp += 5;
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
    stageTime = 300;
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
