# TechNova ERP

A full-stack Enterprise Resource Planning (ERP) application built using **Spring Boot, React, PostgreSQL, and JWT Authentication**.

## Features

- Secure user authentication using JWT
- Interactive dashboard with business analytics
- Product and inventory management
- Supplier and customer management
- Purchase order creation and receiving
- Sales order creation, confirmation, and cancellation
- Automatic inventory updates
- Stock movement history
- Sales and purchase reports
- Responsive user interface

## Tech Stack

**Backend:** Java 21, Spring Boot, Spring Security, Spring Data JPA, Hibernate, Maven

**Frontend:** React, Vite, Tailwind CSS, Axios, Recharts

**Database:** PostgreSQL

**Authentication:** JWT

**API Testing:** Postman

## Project Structure

```text
technova-erp/
├── technova-erp/           # Spring Boot backend
├── technova-erp-frontend/  # React frontend
└── README.md
```

## Getting Started

### Backend

1. Install Java 21 and PostgreSQL.
2. Create a PostgreSQL database named `technova_erp`.
3. Configure the environment variables `DB_PASSWORD` and `JWT_SECRET`.
4. Navigate to the backend directory.
5. Run the application:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend URL: `http://localhost:8080`

### Frontend

Navigate to the frontend directory and run:

```bash
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Business Logic

- Receiving purchase orders increases inventory.
- Confirming sales orders decreases inventory.
- Cancelling confirmed sales orders restores inventory.
- Stock movements maintain a history of inventory changes.
- Reports summarize sales and purchase activity.

## Testing

- REST APIs tested using Postman
- Backend build verified using Maven
- Frontend production build verified using Vite

## Author

**Sahil Shetty**

GitHub: https://github.com/Sahil2078
