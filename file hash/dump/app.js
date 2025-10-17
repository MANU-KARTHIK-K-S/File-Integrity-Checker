// --- 1. DOM Element Selection ---
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const algorithmSelect = document.getElementById('algorithmSelect');
const hashButton = document.getElementById('hashButton');
const resultSection = document.getElementById('result-section');
const hashResult = document.getElementById('hashResult');
const copyButton = document.getElementById('copyButton');
const comparisonInput = document.getElementById('comparisonInput');
const compareButton = document.getElementById('compareButton');
const comparisonResult = document.getElementById('comparisonResult');
const dropArea = document.querySelector('.drop-area');
const loadingIndicator = document.getElementById('loadingIndicator');

let selectedFile = null;

// --- 2. Event Listeners ---

// Handle File Selection
fileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    updateFileDisplay();
});

// Drag and Drop Handlers (Best Practice for modern UI)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
});

dropArea.addEventListener('drop', handleDrop, false);

// Hash Calculation
hashButton.addEventListener('click', calculateHash);

// Copy Hash
copyButton.addEventListener('click', copyHash);

// Comparison
compareButton.addEventListener('click', compareHashes);
comparisonInput.addEventListener('input', () => {
    compareButton.disabled = comparisonInput.value.trim() === "";
    comparisonResult.classList.add('hidden'); // Clear comparison message on input
});


// --- 3. Functions ---

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;
    
    // Set the file input's files property (optional, for full form compatibility)
    // For simplicity, we just take the first file
    selectedFile = files[0];
    updateFileDisplay();
}

function updateFileDisplay() {
    if (selectedFile) {
        fileNameDisplay.textContent = selectedFile.name;
        hashButton.disabled = false;
        // Reset results display
        resultSection.classList.add('hidden');
        comparisonResult.classList.add('hidden');
    } else {
        fileNameDisplay.textContent = 'No file selected.';
        hashButton.disabled = true;
    }
}

/**
 * Executes the file hashing logic (via backend API).
 * In a real application, this would send the file data and algorithm
 * to a server endpoint (e.g., a Flask/Django route) that runs the
 * Python `hash_file` function.
 */
async function calculateHash() {
    if (!selectedFile) return;

    loadingIndicator.classList.remove('hidden'); // Show loader
    hashButton.disabled = true;
    resultSection.classList.add('hidden');

    const algorithm = algorithmSelect.value;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('algorithm', algorithm);

    try {
        // --- Hypothetical API Call ---
        // Replace with actual fetch to your backend server running the Python code
        const response = await fetch('/api/hash-file', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Server error during hashing.');
        }

        const data = await response.json(); // Expected format: { hash: '...', algorithm: '...' }

        // Update UI with result
        hashResult.textContent = data.hash;
        resultSection.querySelector('.result-label span').textContent = data.algorithm.toUpperCase();
        resultSection.classList.remove('hidden');

    } catch (error) {
        console.error('Hashing failed:', error);
        hashResult.textContent = 'Error: Could not calculate hash.';
        resultSection.classList.remove('hidden');
    } finally {
        loadingIndicator.classList.add('hidden'); // Hide loader
        hashButton.disabled = false;
    }
}

function copyHash() {
    navigator.clipboard.writeText(hashResult.textContent).then(() => {
        // Provide visual feedback for copy
        copyButton.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => copyButton.innerHTML = '<i class="far fa-copy"></i>', 1500);
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

function compareHashes() {
    const calculatedHash = hashResult.textContent.trim();
    const inputHash = comparisonInput.value.trim();

    comparisonResult.classList.remove('hidden', 'match', 'mismatch');

    if (calculatedHash === '---' || calculatedHash.includes('Error')) {
        comparisonResult.textContent = 'Please calculate a file hash first.';
        comparisonResult.classList.add('mismatch');
        return;
    }

    if (calculatedHash.toLowerCase() === inputHash.toLowerCase()) {
        comparisonResult.textContent = '✅ Hashes MATCH! File integrity confirmed.';
        comparisonResult.classList.add('match');
    } else {
        comparisonResult.textContent = '❌ Hashes DO NOT MATCH! File may be corrupted or altered.';
        comparisonResult.classList.add('mismatch');
    }
}