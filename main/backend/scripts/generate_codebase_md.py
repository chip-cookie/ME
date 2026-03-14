import os

def generate_tree(startpath, exclude_dirs):
    tree_str = "# Project Structure\n\n```\n"
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        tree_str += '{}{}/\n'.format(indent, os.path.basename(root))
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            tree_str += '{}{}\n'.format(subindent, f)
    tree_str += "```\n\n"
    return tree_str

def is_text_file(filepath):
    # Extension based check for simplicity and speed
    text_extensions = [
        '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.scss', 
        '.md', '.txt', '.py', '.yml', '.yaml', '.toml', '.env'
    ]
    return any(filepath.lower().endswith(ext) for ext in text_extensions) or filepath.endswith('.gitignore') or 'LICENSE' in filepath

def generate_code_dump(root_dir, output_file, exclude_dirs, exclude_files):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Write File Structure
        outfile.write(generate_tree(root_dir, exclude_dirs))
        
        outfile.write("# File Contents\n\n")
        
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files:
                    continue
                    
                file_path = os.path.join(root, file)
                
                # Check if text file
                if not is_text_file(file_path):
                    continue
                    
                relative_path = os.path.relpath(file_path, root_dir)
                extension = os.path.splitext(file)[1][1:] # remove dot
                if not extension:
                    extension = 'text'
                if file == '.gitignore':
                    extension = 'gitignore'
                
                outfile.write(f"## {relative_path}\n\n")
                outfile.write(f"```{extension}\n")
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"Error reading file: {e}")
                
                outfile.write("\n```\n\n")

if __name__ == "__main__":
    root_path = os.getcwd()
    # Output to the artifacts directory so it's safely stored and accessible
    # derived from the current context, hardcoding the known artifact path for this session
    output_path = r"C:\Users\user\.gemini\antigravity\brain\6a6036ac-f112-42b2-a6d6-cab530676359\project_codebase.md"
    
    exclude_directories = {
        'node_modules', '.git', 'dist', '.netlify', '.idea', '.vscode', '__pycache__', 
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml' # treat lock files as dirs to skip? no, logic above is for dirs
    }
    
    # Files to explicitly exclude if they are too large or irrelevant (binary files handled by extension check)
    exclude_filenames = {
        'package-lock.json', 'yarn.lock', 'project_codebase.md', 'generate_codebase_md.py'
    }

    print(f"Generating codebase dump to: {output_path}")
    generate_code_dump(root_path, output_path, exclude_directories, exclude_filenames)
    print("Done.")
