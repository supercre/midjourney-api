let imageCanvas = document.getElementById('imageCanvas');
let maskCanvas = document.getElementById('maskCanvas');
let imageCtx = imageCanvas.getContext('2d');
let maskCtx = maskCanvas.getContext('2d');
let isDrawing = false;
let startX, startY;
let currentX, currentY;
let selectedRegion = null;
let image = new Image();
let base64Mask = '';

// Get image URL and sessionId from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const imageUrl = urlParams.get('imageUrl');
const sessionId = urlParams.get('sessionId');

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

// Load the image
image.onload = function() {
    // Set canvas size to match image
    imageCanvas.width = image.width;
    imageCanvas.height = image.height;
    maskCanvas.width = image.width;
    maskCanvas.height = image.height;
    
    // Draw the image
    imageCtx.drawImage(image, 0, 0);
};

if (imageUrl) {
    image.src = imageUrl;
}

// Mouse events for selection
maskCanvas.addEventListener('mousedown', function(e) {
    isDrawing = true;
    const pos = getMousePos(maskCanvas, e);
    startX = pos.x;
    startY = pos.y;
    currentX = startX;
    currentY = startY;
    
    // Clear previous selection
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
});

maskCanvas.addEventListener('mousemove', function(e) {
    if (!isDrawing || !startX) return;
    
    const pos = getMousePos(maskCanvas, e);
    currentX = pos.x;
    currentY = pos.y;
    
    // Clear and redraw
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    // Draw selection rectangle
    maskCtx.strokeStyle = 'red';
    maskCtx.lineWidth = 2;
    maskCtx.strokeRect(
        startX,
        startY,
        currentX - startX,
        currentY - startY
    );
});

maskCanvas.addEventListener('mouseup', function(e) {
    if (!isDrawing || !startX) return;
    
    const pos = getMousePos(maskCanvas, e);
    currentX = pos.x;
    currentY = pos.y;
    
    const rectWidth = Math.abs(currentX - startX);
    const rectHeight = Math.abs(currentY - startY);
    
    if (rectWidth > 1 && rectHeight > 1) {
        selectedRegion = {
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            width: rectWidth,
            height: rectHeight
        };
        
        // Create mask image
        const maskImage = document.createElement('canvas');
        maskImage.width = maskCanvas.width;
        maskImage.height = maskCanvas.height;
        const maskImageCtx = maskImage.getContext('2d');
        
        // Fill with black
        maskImageCtx.fillStyle = '#000';
        maskImageCtx.fillRect(0, 0, maskImage.width, maskImage.height);
        
        // Fill selected region with white
        maskImageCtx.fillStyle = '#fff';
        maskImageCtx.fillRect(selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height);
        
        // Convert to base64
        const base64String = maskImage.toDataURL('image/png');
        base64Mask = base64String.replace(/^data:image\/png;base64,/, '');
        document.getElementById('maskBase64').value = base64Mask;
    }
    
    isDrawing = false;
});

// Submit button handler
document.getElementById('submitButton').addEventListener('click', async () => {
    if (!base64Mask) {
        alert('영역을 선택해주세요.');
        return;
    }

    try {
        // Create a blob with the base64Mask content
        const blob = new Blob([base64Mask], { type: 'text/plain' });
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'base64mask.txt';
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Change button text temporarily
        const button = document.getElementById('submitButton');
        const originalText = button.textContent;
        button.textContent = '다운로드 완료!';
        button.disabled = true;
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        alert('클립보드 복사 중 오류가 발생했습니다.');
    }
}); 