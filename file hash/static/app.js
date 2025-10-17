// --- DOM Elements ---
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const algorithmSelect = document.getElementById('algorithmSelect');
const hashButton = document.getElementById('hashButton');
const resultSection = document.getElementById('result-section');
const hashResult = document.getElementById('hashResult');
const algoNameDisplay = document.getElementById('algoNameDisplay'); // Added span ID in HTML
const copyButton = document.getElementById('copyButton');
const copyIcon = document.getElementById('copyIcon'); // The <i> element inside copyButton
const comparisonInput = document.getElementById('comparisonInput');
const compareButton = document.getElementById('compareButton');
const comparisonResult = document.getElementById('comparisonResult');
const dropArea = document.getElementById('upload-section');
const loadingIndicator = document.getElementById('loadingIndicator');

let selectedFile = null;

// --- Utility Functions ---
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function updateFileDisplay() {
    if (selectedFile) {
        fileNameDisplay.textContent = selectedFile.name;
        hashButton.disabled = false;
        // Hide previous results and comparison messages
        resultSection.classList.add('hidden');
        comparisonResult.classList.remove('match', 'mismatch');
        comparisonResult.classList.add('hidden');
    } else {
        fileNameDisplay.textContent = 'No file selected.';
        hashButton.disabled = true;
    }
}

function displayMessage(element, message, type) {
    element.textContent = message;
    element.classList.remove('hidden', 'match', 'mismatch');
    // Use the CSS classes for styling the message
    if (type === 'success') {
        element.classList.add('match');
    } else if (type === 'error') {
        element.classList.add('mismatch');
    } else {
        // Use error style for warnings/general messages since there's no dedicated warning style in the provided CSS
        element.classList.add('mismatch'); 
    }
}

// --- Event Handlers ---

// File Input Change
fileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    updateFileDisplay();
});

// Drag and Drop Logic
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

// Add/Remove 'dragover' class for visual feedback (matching CSS)
dropArea.addEventListener('dragenter', () => dropArea.classList.add('dragover'), false);
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'), false);

dropArea.addEventListener('drop', (e) => {
    dropArea.classList.remove('dragover');
    let dt = e.dataTransfer;
    let files = dt.files;
    
    if (files.length > 0) {
        selectedFile = files[0];
        updateFileDisplay();
    } else {
        displayMessage(comparisonResult, 'Please drop a valid file.', 'error');
    }
}, false);


// Hash Calculation
async function calculateHash() {
    if (!selectedFile) return;

    loadingIndicator.classList.remove('hidden');
    hashButton.disabled = true;
    resultSection.classList.add('hidden');
    comparisonResult.classList.add('hidden');

    const algorithm = algorithmSelect.value;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('algorithm', algorithm);

    try {
        const response = await fetch('/hash-file', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json(); 
            throw new Error(errorData.error || `HTTP Error ${response.status}`);
        }

        const data = await response.json(); 

        hashResult.textContent = data.hash;
        algoNameDisplay.textContent = data.algorithm.toUpperCase();
        
        // Ensure error styling is removed and result styling is applied
        hashResult.style.color = 'var(--color-text-light)'; 
        
        resultSection.classList.remove('hidden');

    } catch (error) {
        console.error('Hashing failed:', error);
        hashResult.textContent = `ERROR: ${error.message}`;
        hashResult.style.color = 'var(--color-error)'; // Use error color defined in CSS variables
        resultSection.classList.remove('hidden');
    } finally {
        loadingIndicator.classList.add('hidden');
        hashButton.disabled = false;
    }
}
hashButton.addEventListener('click', calculateHash);


// Copy Hash
function copyHash() {
    navigator.clipboard.writeText(hashResult.textContent).then(() => {
        // Change Font Awesome icon for visual feedback
        copyIcon.classList.remove('far', 'fa-copy');
        copyIcon.classList.add('fas', 'fa-check');
        
        setTimeout(() => {
            copyIcon.classList.remove('fas', 'fa-check');
            copyIcon.classList.add('far', 'fa-copy');
        }, 1500);
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}
copyButton.addEventListener('click', copyHash);


// Comparison Logic
function compareHashes() {
    const calculatedHash = hashResult.textContent.trim();
    const inputHash = comparisonInput.value.trim();

    comparisonResult.classList.add('hidden');

    if (calculatedHash === '---' || calculatedHash.includes('ERROR')) {
        displayMessage(comparisonResult, 'Please calculate a file hash first.', 'error');
        return;
    }
    if (inputHash === '') {
        displayMessage(comparisonResult, 'Please paste a hash to compare.', 'error'); // Using error style for empty input
        return;
    }

    if (calculatedHash.toLowerCase() === inputHash.toLowerCase()) {
        displayMessage(comparisonResult, 'Hashes MATCH! File integrity confirmed.', 'success');
    } else {
        displayMessage(comparisonResult, 'Hashes DO NOT MATCH! File may be corrupted or altered.', 'error');
    }
}

comparisonInput.addEventListener('input', () => {
    compareButton.disabled = comparisonInput.value.trim() === "";
    comparisonResult.classList.add('hidden'); 
});

compareButton.addEventListener('click', compareHashes);

// Initial setup for button state
compareButton.disabled = true;
