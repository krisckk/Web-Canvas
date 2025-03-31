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
let textInput = null;
let isTextMode = false;
let selectedShape = null;
let startX, startY;
let isShapeDrawing = false;
let currentCanvasState = null;

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
            updateCursor();
        } else if (this.id === 'eraser-tool') {
            currentTool = 'eraser';
            updateCursor();
        } else if (this.id === 'text-tool') {
            currentTool = 'text';
            updateCursor();
        } else if (this.id === 'circle-tool') {
            currentTool = 'shape';
            selectedShape = 'circle';
            updateCursor();
        } else if (this.id === 'rectangle-tool') {
            currentTool = 'shape';
            selectedShape = 'rectangle';
            updateCursor();
        } else if (this.id === 'triangle-tool') {
            currentTool = 'shape';
            selectedShape = 'triangle';
            updateCursor();
        }
    });
});

const brushSizeSlider = document.getElementById('brush-size');
const sizeValue = document.getElementById('size-value');
brushSizeSlider.addEventListener('input', function() {
    brushSize = this.value;
    sizeValue.textContent = brushSize;
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

    if (currentTool === 'shape') {
        isShapeDrawing = true;
        currentCanvasState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        if (currentTool === 'brush' || currentTool === 'eraser') {
            lastX = startX;
            lastY = startY;
        }
        isDrawing = true;
        draw(e);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) draw(e);
    if (isShapeDrawing) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.putImageData(currentCanvasState, 0, 0);
        ctx.fillStyle = currentColor;

        if (selectedShape === 'rectangle') {
            ctx.fillRect(startX, startY, x - startX, y - startY);
        } else if (selectedShape === 'circle') {
            const radiusX = (x - startX);
            const radiusY = (y - startY);
            ctx.beginPath();
            ctx.ellipse(startX, startY, Math.abs(radiusX), Math.abs(radiusY), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        } else if (selectedShape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(x, y);
            ctx.lineTo(startX, y);
            ctx.closePath();
            ctx.fill();
        }
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing || isShapeDrawing) {
        saveState();
    }
    isDrawing = false;
    isShapeDrawing = false;
});

function draw(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';

    if (currentTool === 'brush') {
        ctx.strokeStyle = currentColor;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
    } else if (currentTool === 'eraser') {
        ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }

    lastX = x;
    lastY = y;
}

function saveState() {
    canvasHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoHistory = [];
}

function updateCursor() {
    canvas.className = `cursor-${currentTool}${selectedShape ? '-' + selectedShape : ''}`;
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
