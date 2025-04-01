// Canvas setup
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Variables
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let brushSize = 5;
let currentColor = 'black';
let currentTool = 'brush';
let currentFont = 'Arial';
let currentFontSize = '16';
let canvasHistory = [];
let redoHistory = [];
let brushShape = 'circle';
let startX, startY;

// Save initial canvas state
saveState();

// Tool selection
const toolButtons = document.querySelectorAll('.tool-btn');
toolButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        toolButtons.forEach(button => button.classList.remove('active'));
        this.classList.add('active');

        if (this.id === 'brush-tool') {
            currentTool = 'brush';
        } else if (this.id === 'eraser-tool') {
            currentTool = 'eraser';
        } else if (this.id === 'text-tool') {
            currentTool = 'text';
        } else if (this.id === 'circle-tool') {
            brushShape = 'circle';
        } else if (this.id === 'rectangle-tool') {
            brushShape = 'square';
        } else if (this.id === 'triangle-tool') {
            brushShape = 'triangle';
        }

        updateCursor();
    });
});

const brushSizeSlider = document.getElementById('brush-size');
const sizeValue = document.getElementById('size-value');
brushSizeSlider.addEventListener('input', function() {
    brushSize = this.value;
    sizeValue.textContent = brushSize;
    updateCursor(); // update cursor when size changes
});

const colorOptions = document.querySelectorAll('.color-option');
const currentColorDisplay = document.getElementById('current-color');
colorOptions.forEach(color => {
    color.addEventListener('click', function() {
        colorOptions.forEach(option => option.classList.remove('selected'));
        this.classList.add('selected');
        currentColor = this.dataset.color;
        currentColorDisplay.style.backgroundColor = currentColor;
    });
});
colorOptions[0].classList.add('selected');
currentColorDisplay.style.backgroundColor = 'black';

const fontFamilySelect = document.getElementById('font-family');
const fontSizeSelect = document.getElementById('font-size');
fontFamilySelect.addEventListener('change', () => currentFont = fontFamilySelect.value);
fontSizeSelect.addEventListener('change', () => currentFontSize = fontSizeSelect.value);

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    if (currentTool === 'brush' || currentTool === 'eraser') {
        lastX = startX;
        lastY = startY;
        isDrawing = true;
        draw(e);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = x - lastX;
        const dy = y - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / (brushSize / 2));

        for (let i = 0; i < steps; i++) {
            const lerpX = lastX + (dx * i) / steps;
            const lerpY = lastY + (dy * i) / steps;
            drawPoint(lerpX, lerpY);
        }

        lastX = x;
        lastY = y;
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        saveState();
    }
    isDrawing = false;
});

function draw(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawPoint(x, y);
    lastX = x;
    lastY = y;
}

function drawPoint(x, y) {
    ctx.fillStyle = currentTool === 'eraser' ? '#fff' : currentColor;

    if (currentTool === 'brush') {
        if (brushShape === 'circle') {
            ctx.beginPath();
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        } else if (brushShape === 'square') {
            ctx.fillRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
        } else if (brushShape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(x, y - brushSize / 2);
            ctx.lineTo(x + brushSize / 2, y + brushSize / 2);
            ctx.lineTo(x - brushSize / 2, y + brushSize / 2);
            ctx.closePath();
            ctx.fill();
        }
    } else if (currentTool === 'eraser') {
        ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
}

function saveState() {
    canvasHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoHistory = [];
}

function updateCursor() {
    const size = brushSize;
    let cursorSVG = '';

    if (currentTool === 'brush') {
        if (brushShape === 'circle') {
            cursorSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2}' fill='black'/></svg>`;
        } else if (brushShape === 'square') {
            cursorSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='${size}' height='${size}' fill='black'/></svg>`;
        } else if (brushShape === 'triangle') {
            const h = size;
            const w = size;
            cursorSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><polygon points='${w / 2},0 ${w},${h} 0,${h}' fill='black'/></svg>`;
        }
    } else if (currentTool === 'eraser') {
        cursorSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='${size}' height='${size}' fill='gray'/></svg>`;
    }

    if (cursorSVG) {
        const dataUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(cursorSVG)}") ${size / 2} ${size / 2}, auto`;
        canvas.style.cursor = dataUrl;
    } else {
        canvas.style.cursor = 'default';
    }
}

// Action Buttons
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const clearBtn = document.getElementById('clear-btn');

undoBtn.addEventListener('click', () => {
    if (canvasHistory.length > 1) {
        redoHistory.push(canvasHistory.pop());
        const previous = canvasHistory[canvasHistory.length - 1];
        ctx.putImageData(previous, 0, 0);
    }
});

redoBtn.addEventListener('click', () => {
    if (redoHistory.length > 0) {
        const restored = redoHistory.pop();
        canvasHistory.push(restored);
        ctx.putImageData(restored, 0, 0);
    }
});

clearBtn.addEventListener('click', () => {
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
