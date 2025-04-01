# BLMS Backend

A robust backend service for the BLMS (Brainiacs Learning Management System) platform. This service handles authentication, course management, content delivery, and other core functionalities.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [API Documentation](#api-documentation)
- [Docker Setup](#docker-setup)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v12 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/) (v4.2 or higher)
- [PM2](https://pm2.keymetrics.io/) (for production deployment)

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/izabayo7/blms-backend.git
   cd blms-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Setup

1. Create a `.env` file in the root directory by copying the `.env.example` file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration values:
   ```
   NODE_ENV=development
   HOST=localhost:7075
   FRONTEND_HOST=http://localhost:3000
   PORT=7075
   
   MONGO_INITDB_ROOT_USERNAME=your_mongo_username
   MONGO_INITDB_ROOT_PASSWORD=your_mongo_password
   MONGO_INITDB_DATABASE=your_mongo_db
   MONGO_URI=mongodb://your_mongo_username:your_mongo_password@localhost:27017/your_mongo_db?authSource=admin
   
   DEBUG=true
   BASE_PATH=/api
   AUTH_TOKEN=your_secret_auth_token
   DIR='uploads'
   ```

   > Note: For local development without authentication, you can use:
   > `MONGO_URI=mongodb://localhost:27017/your_mongo_db`

### Database Setup

1. Make sure MongoDB is running on your machine:
   ```bash
   # Check if MongoDB is running
   mongod --version
   ```

2. The application will automatically create the necessary collections when it first connects to the database.

## Running the Application

### Development Mode

To start the application in development mode with automatic restart on file changes:

```bash
npm run dev
```

The server will be available at `http://localhost:7075` (or the PORT you specified in .env).

## API Documentation

The API documentation is available through Swagger UI when the application is running:

```
http://localhost:7075/documentation
```

## Docker Setup

To run the application using Docker:

1. Make sure you have Docker and Docker Compose installed.

2. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

3. To stop the containers:
   ```bash
   docker-compose down
   ```

## Project Structure

```
blms-backend/
├── config/            # Configuration files
├── controllers/       # Route controllers
├── middlewares/       # Express middlewares
├── models/            # Mongoose models
├── routes/            # API routes
├── utils/             # Utility functions
├── views/             # Server rendered views
├── .env.example       # Example environment variables
├── .gitignore         # Git ignore file
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker compose configuration
├── index.js           # Application entry point
├── package.json       # Project dependencies
└── README.md          # Project documentation
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Verify your MongoDB connection string in the `.env` file
   - Check if authentication credentials are correct

2. **Port Already in Use**:
   - Change the PORT in your `.env` file
   - Check if another instance of the application is already running

3. **Missing Dependencies**:
   - Run `npm install` to ensure all dependencies are installed

If you encounter any other issues, please submit an issue on the GitHub repository.

---

## License

This project is licensed under the ISC License.
