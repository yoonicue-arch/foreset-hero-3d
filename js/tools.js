<!DOCTYPE html>
<html lang="ko">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>숲속의 작은 용사 3D</title>
    <link rel="stylesheet" href="css/style.css">
</head>

<body>
    <div id="game-container">
        <div id="ui-overlay">
            <div class="hp-bar-outer" style="position: relative;">
                <div id="hp-fill"></div>
                <div id="hp-text"
                    style="position: absolute; width: 100%; text-align: center; color: white; font-weight: bold; font-size: 14px; text-shadow: 1px 1px 2px black; line-height: 20px;">
                    100 / 100</div>
            </div>
            <div class="stats-panel">
                <div class="money-tag">💰 <span id="money-val">0</span></div>
                <div>LV: <span id="lv-val">1</span></div>
                <div style="font-size: 14px; color: #aaa;">EXP: <span id="xp-val">0</span> / <span
                        id="next-xp-val">5</span></div>
                <div style="font-size: 14px; color: #aaa;">EXP: <span id="xp-val">0</span> / <span
                        id="next-xp-val">5</span></div>
                <div style="margin-top: 5px; color: #ff00ff; font-weight: bold;">SCORE: <span id="score-val">0</span>
                </div>
            </div>
            <div id="hud-center"
                style="position: absolute; top: 70px; left: 50%; transform: translateX(-50%); text-align: center; color: white;">
                <div id="stage-display" style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">Stage 1</div>
                <div id="timer-display" style="font-size: 20px; color: #ffeb3b; margin-bottom: 5px;">02:00</div>
                <div id="enemy-count-display" style="font-size: 16px; color: #ff5252;">남은 적: 10</div>
            </div>
            <div id="charge-bar">
                <div id="charge-fill"></div>
            </div>
            <div id="fall-alert">⚠️ 위험! 월드 밖입니다! ⚠️</div>
        </div>

        <div id="start-screen" class="overlay">
            <h1 style="font-size: 60px; color: #4CAF50; margin-bottom: 10px;">숲속의 작은 용사 3D</h1>
            <p style="font-size: 20px; color: #aaa;">- 월드 확장 에디션 -</p>
            <button onclick="initGame()">모험 시작</button>
            <div id="game-version">Ver 1.0</div>
        </div>

        <div id="shop-ui" class="overlay" style="display: none;">
            <h1 style="color: #ffd700; margin-bottom: 20px;">마법 상점</h1>

            <div
                style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; margin-bottom: 20px; width: 80%;">
                <h3 style="margin: 0 0 10px 0; color: #00ffff;">능력치 강화</h3>
                <div class="shop-items">
                    <div class="shop-item">
                        <h3>칼 길이</h3>
                        <p>+30% 증가</p>
                        <button id="btn-upgrade-sword" onclick="buyUpgrade('swordLength')">💰 100</button>
                    </div>
                    <div class="shop-item">
                        <h3>이동 속도</h3>
                        <p>+5% 증가</p>
                        <button id="btn-upgrade-speed" onclick="buyUpgrade('moveSpeed')">💰 100</button>
                    </div>
                    <div class="shop-item">
                        <h3>점프력</h3>
                        <p>+5% 증가</p>
                        <button id="btn-upgrade-jump" onclick="buyUpgrade('jumpPower')">💰 100</button>
                    </div>
                </div>
            </div>

            <button onclick="nextStage()" style="background: #555; margin-top: 40px; width: 200px;">다음 스테이지로</button>
        </div>

        <div id="game-over" class="overlay" style="display: none;">
            <h1 id="fail-title" style="font-size: 60px; color: #ff0040;">GAME OVER</h1>
            <p id="fail-msg">용사가 쓰러졌습니다...</p>
            <button onclick="location.reload()">다시 시작</button>
        </div>
    </div>

    <!-- 외부 라이브러리 및 게임 스크립트 -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="js/tools.js"></script>
    <script src="js/game.js"></script>
</body>

</html>
