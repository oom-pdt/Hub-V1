# Galaxis Hub v1 Prototype

A multi-tenant advertising analytics and workspace management prototype for agencies and client workspaces.

## Developer Prototype Directory & Product Specs

The top **Developer Prototype Directory** toolbar has been redesigned with a modern dark slate & indigo aesthetic:
- **Screen Selector**: Jump to any screen across Agency and Client Workspaces.
- **State Toggles**: Switch between different prototype states and views.
- **Integrated Specs & Notes Drawer**:
  - Click **Specs & Notes** in the top developer bar to open the slide-down specifications drawer.
  - Shows formatted functional specifications, objectives, and acceptance criteria for whichever screen is currently active.
  - Updates automatically as you navigate between screens.
  - Includes status indicators (`Approved`, `In Review`, `Draft`), PM author attribution, and a 1-click **Copy Markdown** button.
  - Press `Esc` or click **Close Specs** to collapse the drawer.

---

## GitHub Pages Deployment

The repository entry point **`index.html`** is generated as a **fully self-contained, single-file bundle**:
- All CSS stylesheets, glassmorphic themes, and layout rules are directly embedded.
- All JavaScript interactivity, navigation logic, and analytics datasets are inlined.
- Zero dependencies on local server paths like `/src/` that cause 404 errors on GitHub Pages subpaths.
- Added `.nojekyll` to prevent GitHub's Jekyll engine from interfering with static file serving.

### How to Host on GitHub Pages:
1. In your GitHub repository (`oom-pdt/Hub-V1`), go to **Settings** &rarr; **Pages**.
2. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or default branch) and `/ (root)` folder
3. Click **Save**.
4. Your site will be live at:
   ```
   https://oom-pdt.github.io/Hub-V1/
   ```

---

## Local Development & Rebuilding

To run locally with Vite:
```bash
npm install
npm run dev
```

To rebuild the standalone HTML bundles after editing modular source code in `src/`:
```bash
npm run build
# Or directly:
python3 scripts/build_standalone.py
```
This updates `index.html`, `standalone.html`, and `dist/` with all changes inlined.
