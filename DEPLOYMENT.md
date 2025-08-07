# Deployment Guide (Conceptual)

This document outlines how to run the applications locally for development and provides conceptual guidance for deployment.

## Backend (`backend` directory)

### Local Development

1.  **Install Dependencies:**
    ```bash
    cd backend
    npm install
    ```
2.  **Set up Environment Variables:**
    Create a `.env` file in the `backend` directory. See `backend/.env.example` (if one existed, or refer to `backend/.env` which contains placeholders) for required variables like `MONGO_URI`, `JWT_SECRET`, `PORT`.
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    This uses `nodemon` to watch for changes and restart the server. The server typically runs on `http://localhost:5001` (or as specified in `.env`).

### Production Build & Run

1.  **Build (if applicable):** For Node.js, a "build" step is usually not needed unless using TypeScript or a transpiler.
2.  **Run Production Server:**
    ```bash
    npm start
    ```
    This runs the `server.js` file directly with `node`. Ensure `NODE_ENV` is set to `production` in your production environment.

### Conceptual Deployment (e.g., Heroku, AWS, Docker)

*   **Procfile:** A `backend/Procfile` (`web: npm start`) is included, suitable for platforms like Heroku.
*   **Environment Variables:** Configure all necessary environment variables (e.g., `MONGO_URI` for production database, `JWT_SECRET`, `NODE_ENV=production`) on your hosting platform.
*   **Database:** Use a managed MongoDB service like MongoDB Atlas for production.
*   **Docker (Optional):**
    *   Create a `Dockerfile` to containerize the backend application.
    *   Build the Docker image and deploy it to a container registry and then to a container orchestration service (e.g., Kubernetes, AWS ECS).

## Frontend - Customer Site (`frontend/customer-site`)

### Local Development

1.  **Install Dependencies:**
    ```bash
    cd frontend/customer-site
    npm install
    ```
2.  **Run Development Server:**
    ```bash
    npm start
    ```
    This starts the React development server, typically on `http://localhost:3000`.

### Production Build

1.  **Build Static Files:**
    ```bash
    npm run build
    ```
    This creates an optimized static build in the `frontend/customer-site/build` directory.

### Serving the Production Build Locally (Example)

If `serve` is installed (e.g., `npm install -g serve` or as a local dev dependency):
```bash
npm run build:serve
# or
cd build
serve -s
```
This will serve the `build` folder. The `frontend/customer-site/serve.json` file provides basic SPA redirect configurations for `serve`.

### Conceptual Deployment (e.g., Netlify, Vercel, AWS S3/CloudFront)

*   **Static Hosting:** Deploy the contents of the `frontend/customer-site/build` directory to any static web hosting service.
    *   **Netlify/Vercel:** Connect your Git repository. They will typically detect it's a Create React App, run `npm run build`, and deploy the `build` folder automatically. Configure build settings as needed.
    *   **AWS S3 & CloudFront:** Upload the `build` folder contents to an S3 bucket configured for static website hosting. Use CloudFront as a CDN for better performance and HTTPS. Ensure proper configuration for SPA routing (e.g., redirecting 404s to `index.html`).
*   **Environment Variables:** Public environment variables (prefixed with `REACT_APP_`) can be configured during the build process on these platforms.

## Frontend - Admin Panel (`frontend/admin-panel`)

Follows a similar pattern to the Customer Site.

### Local Development

1.  **Install Dependencies:**
    ```bash
    cd frontend/admin-panel
    npm install
    ```
2.  **Run Development Server:**
    ```bash
    npm start
    ```
    This starts the React development server, typically on `http://localhost:3001` (as configured in its `package.json`).

### Production Build & Serving

1.  **Build Static Files:**
    ```bash
    npm run build
    ```
    Creates `frontend/admin-panel/build`.
2.  **Serving Locally (Example with `serve`):**
    ```bash
    npm run build:serve
    # This script is configured to serve on port 5002
    ```
3.  **Conceptual Deployment:**
    *   Deploy the `frontend/admin-panel/build` directory. This is often hosted on the same domain as the main site but under a specific path (e.g., `/admin`) or on a subdomain.
    *   Ensure it's protected by authentication, which is handled by the application logic itself connecting to the backend.

## Running Backend & Customer Frontend Concurrently (Local Development)

The backend `package.json` includes a script to run both the backend server and the customer-site frontend development server simultaneously:

1.  Ensure all dependencies for both `backend` and `frontend/customer-site` are installed.
2.  From the `backend` directory:
    ```bash
    npm run dev:concurrent
    ```
    This will start the backend (likely on port 5001) and the customer frontend (likely on port 3000).

This provides a convenient way to work on both parts of the MERN stack locally.
Remember to manage ports correctly if running multiple frontend applications simultaneously (the admin panel is configured for port 3001).
