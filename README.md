# FreeRADIUS SaaS Management Platform

This is a comprehensive full-stack platform for managing FreeRADIUS instances, MikroTik routers, Profiles (Internet Packages), and user sessions. It supports multi-tenancy and is built using Node.js, Express, Fastify, Drizzle ORM, and React (Vite + Tailwind CSS + shadcn/ui).

## Prerequisites

To run this project on a new PC, make sure you have the following installed:

1. **Node.js** (v18 or higher recommended)
2. **PostgreSQL** (v14 or higher recommended, running locally or remotely)
3. **Git** (for version control and cloning the repo)

## Installation Guide

Follow these steps to set up the project on your new machine:

### 1. Clone the repository
```bash
git clone https://github.com/sudoaptgetupdate-y/freeradius-newtype.git
cd freeradius-newtype
```

### 2. Setup Database (PostgreSQL)
1. Open pgAdmin or your terminal.
2. Create a new database (e.g., `freeradius_db`).
3. Note down your username and password for PostgreSQL.

### 3. Configure the Backend
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder. You can copy the variables from `.env.example` if available, or set up the following core variables:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://<USERNAME>:<PASSWORD>@localhost:5432/freeradius_db
   JWT_SECRET=your_super_secret_jwt_key
   ```
   *(Be sure to replace `<USERNAME>` and `<PASSWORD>` with your Postgres credentials).*

4. Run database migrations to create the tables:
   ```bash
   npm run db:push
   ```
   *(Or the equivalent Drizzle command configured in your `package.json`)*

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend should now be running on `http://localhost:3000`.

### 4. Configure the Frontend
1. Open a **new terminal window/tab** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder with the following:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend should now be running on `http://localhost:5173`.

### 5. Access the Application
Open your browser and go to `http://localhost:5173`. 
You can log in using your Master/Super Admin credentials.

---

## Working Across Multiple PCs
When switching between your home PC and work PC, always remember to:
1. **Pull the latest changes** before you start working:
   ```bash
   git pull origin main
   ```
2. **Commit and push** your work when you are done:
   ```bash
   git add .
   git commit -m "Describe your changes"
   git push origin main
   ```
