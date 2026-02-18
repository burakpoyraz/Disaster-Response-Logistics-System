# Disaster Vehicle Request and Task Management System

A web-based management system for coordinating passenger and cargo transportation during disaster situations.

This platform enables digital management of vehicle requests, task assignments, and task tracking. It is designed to reduce manual coordination, prevent communication issues, and improve operational efficiency during emergency response processes.

---

## Overview

During disasters, vehicle allocation and coordination are often handled manually. This can lead to delays, miscommunication, and inefficient resource usage.

This system centralizes:

- Vehicle requests  
- Task assignments  
- Role-based user management  
- Location-based coordination  
- Notification processes  

The goal is to ensure effective and traceable management of transportation resources in emergency scenarios.

---

## Core Features

- JWT-based authentication  
- Role-based access control (Coordinator, Requester, Vehicle Owner)  
- Location-based request creation using Google Maps  
- Task assignment based on vehicle availability  
- Email and in-app notification system  
- Status-based task tracking  

---

## Technology Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | React.js, Tailwind CSS, DaisyUI      |
| Backend    | Node.js, Express.js, JWT             |
| Database   | MongoDB Atlas, Mongoose              |
| Maps       | Google Maps API                      |
| Tools      | Axios, React Query, Postman          |

---

## User Roles

**Coordinator**
- Manages users, vehicles, requests, and tasks  
- Assigns tasks to appropriate vehicles  

**Requester**
- Creates vehicle requests based on location  

**Vehicle Owner**
- Accepts assigned tasks  
- Updates task progress  

---

## Installation

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Create a `.env` file and configure the following variables:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=<mongodb-uri>
JWT_SECRET=<jwt-secret>
GMAIL_ADDRESS=<gmail-account>
GMAIL_PASSWORD=<gmail-password>
GOOGLE_MAPS_API_KEY=<google-maps-key>
```

---

## Running the Application

Start backend:

```bash
npm run dev
```

Start frontend (inside `frontend` directory):

```bash
npm run dev
```

Frontend runs on:
http://localhost:3000

API runs on:
http://localhost:5000

---

## Project Structure

```
.
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── server.js
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── App.jsx, main.jsx
```

---

## API Examples

| Request           | Method | Endpoint              |
|-------------------|--------|-----------------------|
| Login             | POST   | /api/auth/login       |
| Create Request    | POST   | /api/requests         |
| Add Vehicle       | POST   | /api/vehicles         |
| Assign Task       | POST   | /api/tasks            |
| Get Notifications | GET    | /api/notifications    |

---

## Roadmap

- Role-based user system  
- Map-based location selection  
- Task assignment and tracking  
- Mobile version (planned)  
- Real-time vehicle tracking (planned)  
- Advanced reporting (planned)  
- SMS notification integration (planned)  

---

## License

This project is licensed under the MIT License.

---

## Contact

GitHub: https://github.com/burakpoyraz
