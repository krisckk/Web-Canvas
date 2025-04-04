// Canvas setup
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

let savedCanvas = document.createElement('canvas');
let savedCtx = savedCanvas.getContext('2d');

// Default dimensions
canvas.width = 800;
canvas.height = 600;
savedCanvas.width = canvas.width;
savedCanvas.height = canvas.height;

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
let textBox = null;
let isTyping = false;
let textInput = null;

// Save initial canvas state
saveState();
resizeCanvas();

// Tool selection
const toolButtons = document.querySelectorAll('.tool-btn');
toolButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.id !== 'text-tool' && textBox) removeTextInput();
        toolButtons.forEach(button => button.classList.remove('active'));
        this.classList.add('active');
        switch (this.id){
            case 'brush-tool': currentTool = 'brush'; break;
            case 'eraser-tool': currentTool = 'eraser'; break;
            case 'text-tool': currentTool = 'text'; break;
            case 'circle-tool': brushShape = 'circle'; break;
            case 'rectangle-tool': brushShape = 'square'; break;
            case 'triangle-tool': brushShape = 'triangle'; break;
        }
        updateCursor();
    });
});

const brushSizeSlider = document.getElementById('brush-size');
const sizeValue = document.getElementById('size-value');
brushSizeSlider.addEventListener('input', function() {
    brushSize = this.value;
    sizeValue.textContent = brushSize;
    updateCursor();
});

const currentColorDisplay = document.getElementById('current-color');
function updateColorDisplay() {
    currentColorDisplay.style.backgroundColor = currentColor;
}

// Pickr color picker
const pickr = Pickr.create({
    el: '#color-picker',
    theme: 'classic',
    default: 'black',
    swatches: ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff'],
    components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
            input: true,
            save: true
        }
    }
});

pickr.on('change', (color) => {
    currentColor = color.toHEXA().toString();
    updateColorDisplay();
});

// Palette save/load
const savedPaletteContainer = document.getElementById('saved-palette');
const savePaletteBtn = document.getElementById('save-palette-btn');
const loadPaletteBtn = document.getElementById('load-palette-btn');
let savedPalette = [];

savePaletteBtn.addEventListener('click', () => {
    if (!savedPalette.includes(currentColor)) {
        savedPalette.push(currentColor);
        localStorage.setItem('savedPalette', JSON.stringify(savedPalette));
        renderSavedPalette();
    }
});

loadPaletteBtn.addEventListener('click', () => {
    const stored = localStorage.getItem('savedPalette');
    if (stored) {
        savedPalette = JSON.parse(stored);
        renderSavedPalette();
    }
});

function renderSavedPalette() {
    savedPaletteContainer.innerHTML = '';
    savedPalette.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-option';
        div.style.backgroundColor = color;
        div.addEventListener('click', () => {
            currentColor = color;
            updateColorDisplay();
        });
        savedPaletteContainer.appendChild(div);
    });
}

// Resize canvas without scaling content
function resizeCanvas() {
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    savedCanvas.width = oldWidth;
    savedCanvas.height = oldHeight;
    savedCtx.drawImage(canvas, 0, 0);

    const container = document.querySelector('.canvas-container');
    canvas.width = container.clientWidth - 20;
    canvas.height = container.clientHeight - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(savedCanvas, 0, 0);
}

function redrawCanvas() {
    ctx.drawImage(savedCanvas, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
    resizeCanvas();
});


// Update cursor when color changes
pickr.on('change', updateCursor);
currentColorDisplay.style.backgroundColor = 'black';

const fontFamilySelect = document.getElementById('font-family');
const fontSizeSelect = document.getElementById('font-size');
fontFamilySelect.addEventListener('change', () => {
    currentFont = fontFamilySelect.value;
    updateTextInputStyle();
});
fontSizeSelect.addEventListener('change', () => {
    currentFontSize = fontSizeSelect.value;
    updateTextInputStyle();
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    // Handle text tool
    if (currentTool === 'text') {
        // Remove any existing text input
        removeTextInput();
        
        // Create a new text input at the clicked position
        createTextInput(startX, startY);
        return;
    }

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
    if (currentTool === 'text') {
        canvas.style.cursor = 'text';
        return;
    }
    
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

// Function to create text input
function createTextInput(x, y) {
    // Create container div for the text input
    textBox = document.createElement('div');
    textBox.style.position = 'absolute';
    textBox.style.left = (canvas.offsetLeft + x) + 'px';
    textBox.style.top = (canvas.offsetTop + y) + 'px';
    textBox.style.minWidth = '100px';
    textBox.style.minHeight = '30px';
    textBox.style.padding = '5px';
    textBox.style.border = '1px dashed #007bff';
    textBox.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    textBox.style.cursor = 'move';
    textBox.style.zIndex = '1000';
    
    // Create the textarea
    textInput = document.createElement('textarea');
    textInput.style.width = '100%';
    textInput.style.height = '100%';
    textInput.style.border = 'none';
    textInput.style.outline = 'none';
    textInput.style.backgroundColor = 'transparent';
    textInput.style.resize = 'both';
    textInput.style.overflow = 'hidden';
    textInput.style.fontFamily = currentFont;
    textInput.style.fontSize = currentFontSize + 'px';
    textInput.style.color = currentColor;
    
    // Add event listeners
    textInput.addEventListener('keydown', handleTextKeyDown);
    
    // Make the text box draggable
    let isDraggingTextBox = false;
    let textBoxOffsetX = 0;
    let textBoxOffsetY = 0;
    
    textBox.addEventListener('mousedown', (e) => {
        if (e.target === textBox) {
            isDraggingTextBox = true;
            textBoxOffsetX = e.clientX - textBox.getBoundingClientRect().left;
            textBoxOffsetY = e.clientY - textBox.getBoundingClientRect().top;
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDraggingTextBox) {
            textBox.style.left = (e.clientX - textBoxOffsetX) + 'px';
            textBox.style.top = (e.clientY - textBoxOffsetY) + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDraggingTextBox = false;
    });
    
    // Add textarea to the container
    textBox.appendChild(textInput);
    document.body.appendChild(textBox);
    
    // Focus the textarea
    textInput.focus();
}

// Function to update text input style based on current settings
function updateTextInputStyle() {
    if (textInput) {
        textInput.style.fontFamily = currentFont;
        textInput.style.fontSize = currentFontSize + 'px';
        textInput.style.color = currentColor;
    }
}

// Function to handle key presses in the text input
function handleTextKeyDown(e) {
    // Enter key finalizes the text (Shift+Enter allows for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finalizeText();
    }
    
    // Escape key cancels the text input
    if (e.key === 'Escape') {
        removeTextInput();
    }
}

// Function to finalize text and add it to the canvas
function finalizeText() {
    if (!textInput || !textBox) return;
    
    const text = textInput.value;
    if (!text.trim()) {
        removeTextInput();
        return;
    }
    
    // Get the position relative to the canvas
    const textBoxRect = textBox.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const x = textBoxRect.left - canvasRect.left;
    const y = textBoxRect.top - canvasRect.top;
    
    // Set text properties
    ctx.font = `${currentFontSize}px ${currentFont}`;
    ctx.fillStyle = currentColor;
    
    // Draw text on canvas
    const lines = text.split('\n');
    const lineHeight = parseInt(currentFontSize) * 1.2;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, x, y + (index + 1) * lineHeight);
    });
    
    // Save canvas state
    saveState();
    
    // Remove the text input
    removeTextInput();
}

// Function to remove the text input
function removeTextInput() {
    if (textBox) {
        document.body.removeChild(textBox);
        textBox = null;
        textInput = null;
    }
}

// Action Buttons
const undoBtn = document.getElementById('undo-btn');
const clearBtn = document.getElementById('clear-btn');

undoBtn.addEventListener('click', () => {
    if (canvasHistory.length > 1) {
        redoHistory.push(canvasHistory.pop());
        const previous = canvasHistory[canvasHistory.length - 1];
        ctx.putImageData(previous, 0, 0);
    }
});
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
});

// Fix the image upload functionality
const imageUpload = document.getElementById('image-upload');
const downloadBtn = document.getElementById('download-btn');
downloadBtn.addEventListener('click', () => {
    // Create a temporary canvas to add white background if transparent
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Fill with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw original canvas on top
    tempCtx.drawImage(canvas, 0, 0);
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = tempCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

let currentImage = {
    element: null,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    backgroundState: null,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    hasMoved: false // Add this flag
};

imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
            saveState();
            
            // Calculate dimensions
            const maxWidth = canvas.width * 0.8;
            const maxHeight = canvas.height * 0.8;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            
            // Clear previous image if exists
            if (currentImage.element) {
                ctx.putImageData(currentImage.backgroundState, 0, 0);
            }
            
            // Save background state
            const backgroundState = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Draw new image
            ctx.drawImage(img, x, y, width, height);
            
            // Update current image reference
            currentImage = {
                element: img,
                x: x,
                y: y,
                width: width,
                height: height,
                backgroundState: backgroundState,
                isDragging: false,
                dragOffsetX: 0,
                dragOffsetY: 0,
                hasMoved: false // Reset move flag
            };
            
            saveState();
        };
        img.src = URL.createObjectURL(file);
    }
});

// Image interaction handlers
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicking on image (and hasn't been moved yet)
    if (currentImage.element && !currentImage.hasMoved &&
        mouseX >= currentImage.x && 
        mouseX <= currentImage.x + currentImage.width &&
        mouseY >= currentImage.y && 
        mouseY <= currentImage.y + currentImage.height) {
        
        currentImage.isDragging = true;
        currentImage.dragOffsetX = mouseX - currentImage.x;
        currentImage.dragOffsetY = mouseY - currentImage.y;
        return;
    }

    // Original drawing code
    startX = mouseX;
    startY = mouseY;

    if (currentTool === 'text') {
        removeTextInput();
        createTextInput(startX, startY);
        return;
    }

    if (currentTool === 'brush' || currentTool === 'eraser') {
        lastX = startX;
        lastY = startY;
        isDrawing = true;
        draw(e);
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Handle image dragging (only if hasn't moved yet)
    if (currentImage.element && currentImage.isDragging && !currentImage.hasMoved) {
        // Restore background (removes original image)
        ctx.putImageData(currentImage.backgroundState, 0, 0);
        
        // Update position
        currentImage.x = mouseX - currentImage.dragOffsetX;
        currentImage.y = mouseY - currentImage.dragOffsetY;
        
        // Redraw image at new position
        ctx.drawImage(
            currentImage.element,
            currentImage.x,
            currentImage.y,
            currentImage.width,
            currentImage.height
        );
        return;
    }

    // Original drawing code
    if (isDrawing) {
        const x = mouseX;
        const y = mouseY;

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
    // Finalize image dragging
    if (currentImage.element && currentImage.isDragging) {
        currentImage.isDragging = false;
        currentImage.hasMoved = true; // Mark as moved
        // Update background state to include moved image
        currentImage.backgroundState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        saveState();
    }
    
    // Original drawing code
    if (isDrawing) {
        saveState();
        isDrawing = false;
    }
});