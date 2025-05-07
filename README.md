# Job Platform Backend – Version 1 (Modular Architecture)

This is the backend API for a job platform, currently under active development. It's being built with a **modular architecture** to ensure clean separation of concerns, scalability, and maintainability.

---

## 📁 Project Structure

Each feature is encapsulated as a module, following a structure of `routes → controller → service → validator`.

---

## ✅ Current Features

- Modular feature-based structure
- Basic RESTful routes (`user`, `application`, etc.)
- Controllers and validators implemented
- Manual route imports (for control and clarity)
- Postman used for testing APIs

---

## 🗓️ Development Roadmap

### 🔄 Scheduled Next Steps

- [ ] **Code Refactor**: Apply DRY principles across validators, controllers, and services
- [ ] **Filtering, Sorting & Pagination**: Centralized utilities for reusability
- [ ] **Authentication**: JWT-based login/signup flow
- [ ] **Authorization**: Role-based access control (admin, candidate, company)

### 🧱 Backend Phase Completion Plan

- [ ] File upload support (CVs, logos, etc.)
- [ ] Activity logging (user actions, applications)
- [ ] Notifications system (optional)
- [ ] Admin dashboard endpoints
- [ ] Company dashboard endpoints
- [ ] Candidate dashboard endpoints
- [ ] Unit & integration testing

---

## 💻 Frontend (To Start After Backend Phase)

- React frontend
- Modular UI with login, signup, dashboards
- API connection with backend (Axios)
- Responsive design
- Admin / Candidate / Company portals

---

## 🛠 Technologies

- Node.js + Express
- MongoDB + Mongoose
- ES6
- Postman (for testing)
- Git (project versioned on GitHub)

---

## 🧪 How to Run

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Start production server
npm run production:dev

```

# config.env

PORT =
NODE_ENV = development
BASE_URL = http://localhost:
DB_URI =mongodb://localhost:27017/job-platform
