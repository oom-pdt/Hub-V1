import os

def build_standalone():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_path = os.path.join(base_dir, 'index.template.html')
    if not os.path.exists(template_path):
        template_path = os.path.join(base_dir, 'index.html')

    css_path = os.path.join(base_dir, 'src', 'prototype.css')
    data_path = os.path.join(base_dir, 'src', 'data.js')
    specs_path = os.path.join(base_dir, 'src', 'specs.js')
    main_path = os.path.join(base_dir, 'src', 'main.js')

    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()

    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()

    with open(data_path, 'r', encoding='utf-8') as f:
        data_js = f.read()

    specs_clean = ""
    if os.path.exists(specs_path):
        with open(specs_path, 'r', encoding='utf-8') as f:
            specs_clean = f.read().replace('export const ', 'const ')

    with open(main_path, 'r', encoding='utf-8') as f:
        main_js = f.read()

    # Clean export statements from data_js
    data_clean = (data_js
        .replace('export const ', 'const ')
        .replace('export let ', 'let ')
        .replace('export function ', 'function '))

    # Clean import statements from main_js
    main_lines = main_js.split('\n')
    clean_main_lines = []
    in_import = False
    for line in main_lines:
        if line.strip().startswith('import '):
            in_import = True
        if in_import:
            if line.strip().endswith(';'):
                in_import = False
            continue
        clean_main_lines.append(line)
    main_clean = '\n'.join(clean_main_lines)

    combined_js = data_clean + '\n\n' + specs_clean + '\n\n' + main_clean

    # Inline CSS
    html = html.replace('<link rel="stylesheet" href="/src/prototype.css">', '<style>\n' + css + '\n</style>')

    # Inline JS
    html = html.replace('<script type="module" src="/src/main.js"></script>', '<script>\n' + combined_js + '\n</script>')

    # Save to index.html (for GitHub Pages root), standalone.html, and public/galaxis-hub-prototype.html
    out_paths = [
        os.path.join(base_dir, 'index.html'),
        os.path.join(base_dir, 'standalone.html'),
        os.path.join(base_dir, 'public', 'galaxis-hub-prototype.html')
    ]
    if os.path.exists(os.path.join(base_dir, 'dist')):
        out_paths.append(os.path.join(base_dir, 'dist', 'index.html'))
        out_paths.append(os.path.join(base_dir, 'dist', 'standalone.html'))
        out_paths.append(os.path.join(base_dir, 'dist', 'galaxis-hub-prototype.html'))

    os.makedirs(os.path.join(base_dir, 'public'), exist_ok=True)

    for out_path in out_paths:
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Generated standalone HTML at: {out_path} ({os.path.getsize(out_path):,} bytes)")

if __name__ == '__main__':
    build_standalone()
