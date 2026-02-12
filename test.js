const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');

const dom = new JSDOM(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>贪吃蛇游戏</title>
</head>
<body>
    <div class="score-board">
        <span class="score-label">分数：</span>
        <span id="score" class="score-value">0</span>
    </div>
    <canvas id="gameCanvas" width="400" height="400"></canvas>
    <div class="controls">
        <button id="startBtn" class="btn btn-start">开始游戏</button>
        <button id="restartBtn" class="btn btn-restart" disabled>重新开始</button>
    </div>
</body>
</html>
`);

global.document = dom.window.document;
global.HTMLCanvasElement.prototype.getContext = () => ({
    fillStyle: '',
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    create: () => ({ addColorStop: () => {} }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    font: '',
    textAlign: '',
    fillText: () => {}
});

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let nextDx = 0;
let nextDy = 0;
const gridSize = 20;
const tileCount = 400 / gridSize;

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
    nextDx = 1;
    nextDy = 0;
    score = 0;
    generateFood();
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            return;
        }
    }
}

function update() {
    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return false;
    }

    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            return false;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        generateFood();
    } else {
        snake.pop();
    }
    return true;
}

describe('贪吃蛇游戏测试', () => {
    
    describe('蛇的初始位置', () => {
        test('蛇的初始位置应该正确', () => {
            initGame();
            
            expect(snake).toHaveLength(3);
            expect(snake[0]).toEqual({ x: 10, y: 10 });
            expect(snake[1]).toEqual({ x: 9, y: 10 });
            expect(snake[2]).toEqual({ x: 8, y: 10 });
        });

        test('蛇的初始方向应该是向右', () => {
            initGame();
            
            expect(dx).toBe(1);
            expect(dy).toBe(0);
        });

        test('初始分数应该是0', () => {
            initGame();
            
            expect(score).toBe(0);
        });
    });

    describe('食物生成', () => {
        test('食物应该在游戏范围内生成', () => {
            initGame();
            
            expect(food.x).toBeGreaterThanOrEqual(0);
            expect(food.x).toBeLessThan(tileCount);
            expect(food.y).toBeGreaterThanOrEqual(0);
            expect(food.y).toBeLessThan(tileCount);
        });

        test('食物不应该生成在蛇身上', () => {
            initGame();
            
            const onSnake = snake.some(segment => 
                segment.x === food.x && segment.y === food.y
            );
            expect(onSnake).toBe(false);
        });

        test('生成多次食物都应该在范围内', () => {
            initGame();
            
            for (let i = 0; i < 100; i++) {
                generateFood();
                expect(food.x).toBeGreaterThanOrEqual(0);
                expect(food.x).toBeLessThan(tileCount);
                expect(food.y).toBeGreaterThanOrEqual(0);
                expect(food.y).toBeLessThan(tileCount);
            }
        });
    });

    describe('撞墙检测', () => {
        test('撞到左墙应该返回false', () => {
            initGame();
            snake = [{ x: 0, y: 10 }];
            nextDx = -1;
            nextDy = 0;
            
            const result = update();
            expect(result).toBe(false);
        });

        test('撞到右墙应该返回false', () => {
            initGame();
            snake = [{ x: tileCount - 1, y: 10 }];
            nextDx = 1;
            nextDy = 0;
            
            const result = update();
            expect(result).toBe(false);
        });

        test('撞到上墙应该返回false', () => {
            initGame();
            snake = [{ x: 10, y: 0 }];
            nextDx = 0;
            nextDy = -1;
            
            const result = update();
            expect(result).toBe(false);
        });

        test('撞到下墙应该返回false', () => {
            initGame();
            snake = [{ x: 10, y: tileCount - 1 }];
            nextDx = 0;
            nextDy = 1;
            
            const result = update();
            expect(result).toBe(false);
        });

        test('不撞墙应该正常移动', () => {
            initGame();
            snake = [{ x: 5, y: 5 }];
            nextDx = 1;
            nextDy = 0;
            
            const result = update();
            expect(result).toBe(true);
            expect(snake[0]).toEqual({ x: 6, y: 5 });
        });
    });

    describe('撞自己检测', () => {
        test('蛇头撞到蛇身应该返回false', () => {
            initGame();
            snake = [
                { x: 5, y: 5 },
                { x: 6, y: 5 },
                { x: 7, y: 5 }
            ];
            nextDx = 1;
            nextDy = 0;
            
            const result = update();
            expect(result).toBe(false);
        });

        test('不撞自己应该正常移动', () => {
            initGame();
            snake = [
                { x: 5, y: 5 },
                { x: 4, y: 5 },
                { x: 3, y: 5 }
            ];
            nextDx = 1;
            nextDy = 0;
            
            const result = update();
            expect(result).toBe(true);
        });
    });

    describe('吃食物功能', () => {
        test('吃到食物后分数应该增加', () => {
            initGame();
            const initialScore = score;
            snake = [{ x: 5, y: 5 }];
            food = { x: 6, y: 5 };
            nextDx = 1;
            nextDy = 0;
            
            update();
            expect(score).toBe(initialScore + 10);
        });

        test('吃到食物后蛇身应该变长', () => {
            initGame();
            const initialLength = snake.length;
            snake = [{x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}];
            food = { x: 6, y: 5 };
            nextDx = 1;
            nextDy = 0;
            
            update();
            expect(snake.length).toBe(initialLength + 1);
        });

        test('没吃到食物蛇身长度应该保持不变', () => {
            initGame();
            const initialLength = snake.length;
            snake = [{x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}];
            food = { x: 10, y: 10 };
            nextDx = 1;
            nextDy = 0;
            
            update();
            expect(snake.length).toBe(initialLength);
        });

        test('连续吃食物分数应该累加', () => {
            initGame();
            score = 0;
            snake = [{ x: 5, y: 5 }];
            
            for (let i = 0; i < 3; i++) {
                food = { x: snake[0].x + 1, y: snake[0].y };
                nextDx = 1;
                nextDy = 0;
                update();
            }
            
            expect(score).toBe(30);
        });
    });

    describe('游戏移动', () => {
        test('蛇应该按照当前方向移动', () => {
            initGame();
            snake = [{ x: 5, y: 5 }];
            nextDx = 1;
            nextDy = 0;
            
            update();
            expect(snake[0]).toEqual({ x: 6, y: 5 });
        });

        test('向左移动应该正确', () => {
            initGame();
            snake = [{ x: 10, y: 10 }];
            nextDx = -1;
            nextDy = 0;
            
            update();
            expect(snake[0]).toEqual({ x: 9, y: 10 });
        });

        test('向上移动应该正确', () => {
            initGame();
            snake = [{ x: 10, y: 10 }];
            nextDx = 0;
            nextDy = -1;
            
            update();
            expect(snake[0]).toEqual({ x: 10, y: 9 });
        });

        test('向下移动应该正确', () => {
            initGame();
            snake = [{ x: 10, y: 10 }];
            nextDx = 0;
            nextDy = 1;
            
            update();
            expect(snake[0]).toEqual({ x: 10, y: 11 });
        });
    });
});
