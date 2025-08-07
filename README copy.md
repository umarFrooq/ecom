# MERN Stack E-commerce Website (Mafrushat Inspired)

This project is a MERN (MongoDB, Express.js, React.js, Node.js) stack application designed to emulate features of an e-commerce website like [Mafrushat Eurubat Almanar](https://mafrushat-eurubat-almanar.com/). It includes a customer-facing frontend, an admin panel for managing products and categories, and a backend API.

## Project Features (Implemented & Planned)

*   **Multilingual Support:** English and Arabic languages for product information and UI.
*   **Backend API:**
    *   RESTful APIs for products, categories, and admin authentication.
    *   MongoDB for data storage with Mongoose ODM.
    *   JWT-based authentication for admin routes.
    *   Role-based authorization (admin, editor).
    *   (Planned: S3 integration for product image uploads).
*   **Customer Frontend:**
    *   React-based SPA.
    *   Product listing, viewing (details to be built).
    *   Internationalization with `i18next`.
    *   Bootstrap and Modular CSS for styling.
    *   Basic SEO setup (`react-helmet-async`, `robots.txt`).
*   **Admin Panel Frontend:**
    *   Separate React-based SPA for administration.
    *   Login functionality.
    *   (Planned: Dashboards for product, category, and order management; analytics).
    *   Internationalization with `i18next`.
*   **SEO:** Foundational SEO practices for the customer site.
*   **Optimized Code:** Focus on clean, organized, and reasonably optimized code.

## Project Structure

```
.
├── backend/                # Node.js, Express.js, MongoDB backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── tests/              # Backend tests (Jest)
│   ├── .env                # Environment variables (gitignored)
│   ├── db.js               # Database connection
│   ├── package.json
│   └── server.js           # Main backend server file
│   └── Procfile            # For PaaS deployment (e.g. Heroku)
├── frontend/
│   ├── admin-panel/        # React Admin Panel
│   │   ├── public/
│   │   ├── src/
│   │   └── package.json
│   └── customer-site/      # React Customer-Facing Website
│       ├── public/
│       ├── src/
│       └── package.json
│       └── serve.json      # Configuration for 'serve' CLI
├── DEPLOYMENT.md           # Setup, run, and deployment instructions
└── README.md               # This file
```

## Technologies Used

*   **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, dotenv, cors
*   **Frontend:** React.js, React Router, Axios, Bootstrap, React-Bootstrap, i18next, SASS/Modular CSS (planned)
*   **Development:** Concurrently, Nodemon, Jest (for testing - setup attempted)

## Setup and Running the Project

Please refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:
*   Setting up the development environment.
*   Running the backend server.
*   Running the frontend customer site.
*   Running the frontend admin panel.
*   Running backend and frontend concurrently.
*   Conceptual deployment guidelines.

## API Documentation (Conceptual)

While full Swagger/OpenAPI documentation is not generated in this iteration, the API endpoints are structured as follows:

*   **Auth:** `/api/auth` (login, get current user)
*   **Categories:** `/api/categories` (CRUD operations)
*   **Products:** `/api/products` (CRUD operations, public fetching with filters/pagination)

In a full implementation, tools like `swagger-jsdoc` and `swagger-ui-express` would be integrated into the backend to provide interactive API documentation.

## Testing (Conceptual)

Testing frameworks (Jest, React Testing Library) have been set up.
*   **Backend:** Unit and integration tests are planned. Initial setup faced environment constraints.
*   **Frontend:** Component tests are planned. Initial setup faced environment constraints.

Refer to the `tests` directory in `backend` and component-level test files in frontend projects for examples.

## Contribution

This project is primarily a demonstration. For contributions, please follow standard Git workflow (fork, branch, PR).
Ensure code is linted and, where possible, covered by tests. (Testing currently blocked by environment).
