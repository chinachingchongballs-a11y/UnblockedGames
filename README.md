# PlayZone - Unblocked Games Hub

Instant-play unblocked games portal storing each game as an iframe in a JSON catalog (`games.json`).

## GitHub Pages Deployment

Your page was previously blank on GitHub Pages because:
1. **Asset Base Paths**: Standard Vite builds use absolute `/assets/...` paths, which fail when hosted on a GitHub Pages subpath (e.g. `https://<username>.github.io/<repository>/`). We configured `base: './'` in `vite.config.js` so all built assets and games load with relative paths.
2. **Automated Build**: GitHub Pages does not compile JSX from source files directly. We added a GitHub Actions workflow that automatically builds and deploys your site on every push!

### Option 1: GitHub Actions (Recommended)
1. Push your repository to GitHub.
2. On GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` will automatically build and publish your site!

### Option 2: Deploy via `/docs` folder
If you prefer deploying from a branch folder:
```bash
npm run build:docs
```
Then commit the `docs` folder, and in **Settings** > **Pages**, choose **Deploy from a branch** and select `/docs`.

## Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the applet.
