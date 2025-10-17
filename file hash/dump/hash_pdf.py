import hashlib

def hash_file(filepath, algorithm='sha256', block_size=65536):
    """
    Calculates the hash of a file using the specified algorithm.
    Supported algorithms: 'sha256', 'sha512', 'md5', 'sha1'
    Args:
        filepath (str): Path to the file.
        algorithm (str): Hash algorithm to use.
        block_size (int): Number of bytes per read (default: 64KB).
    Returns:
        str: Hexadecimal hash string.
    """
    # Get the hash constructor from hashlib
    try:
        hash_func = getattr(hashlib, algorithm)()
    except AttributeError:
        raise ValueError(f'Unsupported hash algorithm: {algorithm}')
        
    with open(filepath, 'rb') as file:
        while True:
            chunk = file.read(block_size)
            if not chunk:
                break
            hash_func.update(chunk)
    return hash_func.hexdigest()

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python hash_pdf.py <file_path> <algorithm>")
        print("Example: python hash_pdf.py mydoc.pdf sha512")
    else:
        file_path = sys.argv[1]
        algorithm = sys.argv[2].lower()
        file_hash = hash_file(file_path, algorithm)
        print(f"{algorithm.upper()} hash of {file_path}:\n{file_hash}")
