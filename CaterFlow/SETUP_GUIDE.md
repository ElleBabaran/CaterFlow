# 🚀 CaterFlow Setup Guide for Groupmates

Welcome! Follow these steps to get the project running on your local machine.

## 📋 Prerequisites
- **Node.js** (Latest LTS version recommended)
- **VS Code**
- **Internet Connection** (for MongoDB Atlas and AI services)

---

## 🛠️ Installation Steps

### 1. Clone the Repository
If you haven't already:
```bash
git clone <repository-url>
cd CaterFlow
```

### 2. Install Dependencies
Open your terminal in VS Code and run:
```bash
npm install
```
*This will download all the necessary libraries for both the frontend and backend.*

### 3. Environment Configuration (.env)
The `.env` file contains sensitive API keys and is **not** included in the GitHub repository. 
1. Create a new file named `.env` in the root folder.
2. Ask the project owner (Aron) for the contents of the `.env` file.
3. Paste the contents into your new `.env` file.

### 4. Running the Application

You need to run **two** terminals at the same time:

**Terminal 1: Backend Server**
```bash
npm start
```
*You should see: `[CaterFlow] Connected to MongoDB Atlas`.*

**Terminal 2: Frontend UI**
```bash
npm run dev
```
*Click the link (usually `http://localhost:5173`) to open the app.*

---

## ☁️ Database (MongoDB Atlas)
We are using a **centralized cloud database**. 
- You do **not** need to install MongoDB locally.
- All chat history and events are saved to the cloud.
- If you want to see the database records, you can use [MongoDB Compass](https://www.mongodb.com/products/compass) with the `MONGODB_URI` from the `.env` file.

## 🤖 AI Orchestration
The system uses Gemini and OpenAI. Make sure your `.env` keys are correct for the AI agents to respond.

---
*Happy Coding!* 🚀
