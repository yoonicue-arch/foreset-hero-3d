/**
 * 한글 또는 문자를 특정 격자 크기의 2차원 배열(0, 1)로 변환하는 함수
 * * @param {string} font - 사용할 폰트명 (예: 'Malgun Gothic', 'Dotum')
 * @param {number} gridSize - 결과 격자의 크기 (예: 32 -> 32x32)
 * @param {string} char - 변환할 글자 (한 글자 권장)
 * @returns {Array<Array<number>>} 0과 1로 구성된 2차원 배열
 */
function generateCharGrid(font, gridSize, char) {
    // 1. 작업을 위한 보이지 않는 캔버스 생성
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // 2. 고해상도 렌더링을 위해 임시 캔버스 크기를 크게 설정 (정밀한 여백 계산용)
    const renderSize = 200;
    canvas.width = renderSize;
    canvas.height = renderSize;

    // 3. 글자 렌더링
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${renderSize * 0.8}px ${font}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.clearRect(0, 0, renderSize, renderSize);
    ctx.fillText(char, renderSize / 2, renderSize / 2);

    // 4. Bounding Box (실제 글자가 그려진 영역) 찾기
    const imgData = ctx.getImageData(0, 0, renderSize, renderSize);
    const pixels = imgData.data;
    let minX = renderSize, minY = renderSize, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < renderSize; y++) {
        for (let x = 0; x < renderSize; x++) {
            const alpha = pixels[(y * renderSize + x) * 4 + 3];
            if (alpha > 50) { // 픽셀이 투명하지 않으면 영역에 포함
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                found = true;
            }
        }
    }

    // 글자가 없는 경우 빈 배열 반환
    if (!found) return Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

    // 5. 글자 영역만 추출
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const trimmedData = ctx.getImageData(minX, minY, width, height);

    // 6. 목표 격자 크기에 꽉 차게 리사이징하여 다시 그리기
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d').putImageData(trimmedData, 0, 0);

    canvas.width = gridSize;
    canvas.height = gridSize;
    ctx.clearRect(0, 0, gridSize, gridSize);
    // drawImage를 사용해 비트맵 데이터를 목표 크기에 맞게 Stretch 시킴
    ctx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, gridSize, gridSize);

    // 7. 최종 픽셀 데이터를 읽어 0/1 배열로 변환
    const finalPixels = ctx.getImageData(0, 0, gridSize, gridSize).data;
    const resultGrid = [];

    for (let y = 0; y < gridSize; y++) {
        const row = [];
        for (let x = 0; x < gridSize; x++) {
            const alpha = finalPixels[(y * gridSize + x) * 4 + 3];
            // 투명도 50% 이상을 1(색상 있음)로 간주
            row.push(alpha > 128 ? 1 : 0);
        }
        resultGrid.push(row);
    }

    return resultGrid;
}

// --- 사용 예시 ---
// const myGrid = generateCharGrid('Malgun Gothic', 32, '가');
// console.log(myGrid); // 32x32 형태의 0, 1 배열 출력
