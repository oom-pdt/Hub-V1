# Galaxis Hub v1 Prototype

A multi-tenant advertising analytics and workspace management prototype for agencies and client workspaces.

## How to Share and View the Raw HTML Page on GitHub

This prototype includes a **fully self-contained, single-file raw HTML bundle**:
- **`standalone.html`** (in the repository root)

All CSS styles, icons, JavaScript logic, and mock analytics datasets are completely bundled into this single `.html` file. It requires **no server, no Node.js runtime, and no build tools** to run.

---

### Option 1: Live Public Website via GitHub Pages (Recommended)
You can turn this repository into a free, live web page accessible by anyone with a URL:

1. In your GitHub repository, go to **Settings** &rarr; **Pages**.
2. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or default branch) and `/ (root)` folder
3. (Optional) To make it load at the root of your GitHub Pages URL, copy or rename `standalone.html` to `index.html`.
4. Click **Save**. Within 1–2 minutes, GitHub will publish your live website at:
   ```
   https://<username>.github.io/<repository-name>/standalone.html
   ```

---

### Option 2: Instant View via HTMLPreview (Zero Setup)
Anyone can preview the raw HTML file directly rendered from your public GitHub repository:

```
https://htmlpreview.github.io/?https://github.com/<USERNAME>/<REPOSITORY>/blob/main/standalone.html
```

Replace `<USERNAME>` and `<REPOSITORY>` with your GitHub username and repository name. Anyone with the link can immediately interact with the prototype in their browser.

---

### Option 3: Direct Download & Offline Use
Anyone browsing the GitHub repository can:
1. Click on `standalone.html` in GitHub.
2. Click **Download raw file**.
3. Double-click the downloaded file to run it immediately in Chrome, Safari, Edge, or Firefox.

---

### Option 4: Local Development
To run or edit the modular source code with Vite:
```bash
npm install
npm run dev
```

To re-compile the standalone HTML bundle after editing `src/`:
```bash
npm run build
# Or directly:
python3 scripts/build_standalone.py
```
