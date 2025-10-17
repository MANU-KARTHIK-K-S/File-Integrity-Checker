import hashlib
import os
import tempfile
import logging
from flask import Flask, request, jsonify, render_template

# --- LOGGING CONFIGURATION ---
# Configure the root logger to output helpful information
# This helps ensure all logs (including Flask's) are formatted consistently
logging.basicConfig(level=logging.INFO, 
                    format='%(levelname)s - %(message)s')

# Get the logger instance for the application
app_logger = logging.getLogger(__name__)


# --- CORE HASHING LOGIC ---

def hash_file(filepath, algorithm='sha256', block_size=65536):
    """Calculates the hash of a file."""
    try:
        hash_func = hashlib.new(algorithm)
    except ValueError:
        app_logger.error(f"Attempted to use unsupported hash algorithm: {algorithm}")
        raise ValueError(f'Unsupported hash algorithm: {algorithm}')

    app_logger.info(f"Starting hash calculation for file: {filepath} with algorithm: {algorithm}")
    
    with open(filepath, 'rb') as file:
        while True:
            chunk = file.read(block_size)
            if not chunk:
                break
            hash_func.update(chunk)
            
    hex_digest = hash_func.hexdigest()
    app_logger.info(f"Successfully calculated {algorithm.upper()} hash for file.")
    return hex_digest

# --- FLASK APPLICATION SETUP ---

app = Flask(__name__)
# Attach the logger to the Flask app for easy access in routes
app.logger.handlers = app_logger.handlers 
app.logger.setLevel(app_logger.level)

app.secret_key = 'super_secret_key_for_hashing_app'

# --- FLASK ROUTES ---

@app.route('/')
def index():
    """Serves the main HTML UI page."""
    app_logger.info("Serving main index page.")
    return render_template('index.html')

@app.route('/hash-file', methods=['POST'])
def hash_file_api():
    """Handles file upload and returns the calculated hash."""
    
    # Extract User-Agent header
    user_agent = request.headers.get('User-Agent', 'Unknown Client')
    
    app_logger.info(f"Received hash request from IP: {request.remote_addr}, Agent: {user_agent}")
    
    if 'file' not in request.files:
        app_logger.warning(f"Request failed (Agent: {user_agent}): No 'file' part in the request.")
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    algorithm = request.form.get('algorithm', 'sha256').lower()
    filename = file.filename

    if filename == '':
        app_logger.warning(f"Request failed (Agent: {user_agent}): No file selected in the form.")
        return jsonify({'error': 'No selected file'}), 400

    app_logger.info(f"Processing file: '{filename}' using algorithm: {algorithm}")
    
    allowed_algorithms = ['sha256', 'sha512', 'md5', 'sha1']
    if algorithm not in allowed_algorithms:
        app_logger.error(f"Request denied (Agent: {user_agent}): Unsupported algorithm '{algorithm}' for file '{filename}'.")
        return jsonify({'error': f'Unsupported algorithm: {algorithm}'}), 400

    temp_file_path = None
    try:
        # Use a temporary file to securely handle the upload
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file_path = temp_file.name
            file.save(temp_file_path)
        
        app_logger.info(f"File '{filename}' saved temporarily to: {temp_file_path}")

        # Calculate the hash
        calculated_hash = hash_file(temp_file_path, algorithm=algorithm)

        # Return the result
        app_logger.info(f"Request successful (Agent: {user_agent}): Hash calculated for '{filename}'.")
        return jsonify({
            'hash': calculated_hash,
            'algorithm': algorithm,
            'filename': filename
        })

    except ValueError as e:
        app_logger.error(f"Hashing error for '{filename}' (Agent: {user_agent}): {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        app_logger.exception(f"Unexpected exception during processing of '{filename}' (Agent: {user_agent}).")
        return jsonify({'error': 'Internal server error during hashing.'}), 500
    finally:
        # IMPORTANT: Clean up the temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                app_logger.info(f"Successfully cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                app_logger.error(f"Failed to delete temporary file {temp_file_path}: {e}")

if __name__ == '__main__':
    # Run the Flask application
    app_logger.info("Starting Flask application.")
    app.run(debug=True,host='0.0.0.0',port=8080)
