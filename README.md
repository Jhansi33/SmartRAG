# Domain-Specific RAG Chatbot with Content Tagging & Feedback Q&A Assistant

A modern, production-ready, enterprise-grade AI chatbot system built with **FastAPI**, **React.js (Vite)**, and **MongoDB**. This project integrates **Retrieval-Augmented Generation (RAG)** over a database of 50+ corporate documents, features a **Feedback-based Q&A Assistant**, utilizes a **dynamic Content Tagging expert**, and logs live performance analytics in a glassmorphic evaluation dashboard.

This application is **100% free, runs fully locally and offline**, and is optimized for placement interviews, recruiters, and engineering portfolios.

---

## 🌟 Key Features

### 1. Domain-Specific RAG Chatbot
- **Conversational Stream:** ChatGPT-style interface with a floating typing animation, suggested follow-up chips, copy-response buttons, and internal chat text searching.
- **Semantic File Retrieval:** Utilizes Hugging Face's open-source `sentence-transformers/all-MiniLM-L6-v2` model to embed queries locally into 384-dimensional dense vectors.
- **Accordion Source Accordions:** Each AI response includes detailed collapsible citations revealing the original filenames, chunk contexts, and exact relevance similarity scores.
- **Bulletproof Persistence:** Index representations are stored locally via **FAISS** with a custom **pure-NumPy Cosine Similarity matrix** fallback to ensure 100% execution stability on Windows.

### 2. Feedback-Based Q&A Assistant
- **Collection `feedback_qa`:** Hybrid keyword + semantic vector search matching questions and tag categories directly in MongoDB Atlas.
- **Synthesized multi-matches:** Automatically combines and summarizes contents if multiple relevant entries exist, yielding quick, centralized answers.

### 3. Content Tagging Expert Module
- **POST `/generate-tags`:** Parses Question-Answer pairs to auto-extract 4 to 8 technical content tags.
- **Smart NLP Extraction:** Employs stop-word filtering and bi-gram tokenizing to pull clear technical tags without requiring paid external LLM connections.

### 4. RAG Evaluation & Dashboard
- **Live Metric Loggers:** Measures Precision@K, Recall@K, Context Relevance, Answer Relevance, and a unified Response Quality Score (0 to 10 scale).
- **Interactive Visual Analytics:** Sleek AreaCharts and BarCharts utilizing **Recharts** to plot quality progressions and accuracy metrics.
- **Leaderboard:** Lists the highest-scoring source files inside the vector database.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite) | High-speed, modern SPA |
| **Styling** | Tailwind CSS v3 | Beautiful typography, layout animations, and glassmorphic overlays |
| **Charts** | Recharts | Modern SVG line, area, and bar charts |
| **Backend** | Python FastAPI | Asynchronous web APIs |
| **Database** | MongoDB (Motor client) | Asynchronous JSON document database |
| **Vector DB** | FAISS + NumPy fallback | Lightning-fast local embedding indexing |
| **AI / Embeddings** | Sentence-Transformers | Local 384d sentence encoder (all-MiniLM-L6-v2) |
| **Security** | JWT (python-jose & bcrypt) | Role-based authorization controls (Admin vs User) |

---

## 📁 Repository Directory Structure

```text
domainspecificrag/
├── backend/                  # Python FastAPI Backend
│   ├── app/                  # FastAPI Application Core
│   │   ├── database/         # MongoDB Client & Automated Indexing
│   │   ├── models/           # Pydantic Schemas & PyObjectId Validators
│   │   ├── routes/           # Security, RAG, Tagging, and Analytics Router Endpoints
│   │   ├── services/         # JWT Auth, RAG Pipeline, Tagger, and Feedback Logic
│   │   ├── utils/            # PyPDF parsers, text splitters, and RAG Evaluators
│   │   └── vectorstore/      # Local FAISS index & NumPy Similarity manager
│   ├── scripts/              # seeder scripts (generate_samples.py)
│   ├── .env                  # active local environment variables
│   └── requirements.txt      # python server package list
└── frontend/                 # React.js SPA Frontend
    ├── src/                  # React source
    │   ├── components/       # Collapsible Sidebars, Navbars, and Protected routes
    │   ├── context/          # JWT Session Auth and Dark/Light Theme states
    │   ├── hooks/            # useTheme hooks
    │   ├── pages/            # Dashboard, Chatbot, Upload, QA Database, and Tagger pages
    │   ├── services/         # Axios API clients
    │   └── styles/           # Tailwind CSS index stylesheet
    ├── tailwind.config.js    # custom slate/brand colors configuration
    └── package.json          # npm frontend package list
```

---

## 💾 MongoDB Database Schema Configuration

The application automatically provisions collections and indexes on startup:

### 1. `users`
- **Purpose:** Secure identity profiles.
- **Index:** Unique ASCENDING index on `email`.
- **Fields:** `_id`, `name`, `email`, `password` (hashed), `role` (`admin` or `user`), `createdAt`.

### 2. `documents`
- **Purpose:** Cataloging files ingested for RAG contexts.
- **Index:** ASCENDING index on `filename`.
- **Fields:** `_id`, `filename`, `filetype`, `uploadDate`, `documentPath`, `chunksCount`.

### 3. `feedback_qa`
- **Purpose:** QA repository for hybrid feedback searching.
- **Index:** Compound TEXT search index on `question` and `tags`.
- **Fields:** `_id`, `question`, `answer`, `tags`, `createdAt`, `updatedAt`.

### 4. `chat_history`
- **Purpose:** User chat logs.
- **Index:** Compound search index on `userId` and `timestamp` (DESCENDING).
- **Fields:** `_id`, `userId`, `question`, `response`, `retrievedSources`, `timestamp`.

### 5. `evaluations`
- **Purpose:** Historical metrics tracking.
- **Index:** DESCENDING index on `createdAt`.
- **Fields:** `_id`, `retrievalAccuracy`, `precisionAtK`, `recallAtK`, `answerRelevance`, `responseQuality`, `createdAt`.

---

## 🚀 Setup & Installation Instructions (Windows)

Ensure you have **Python 3.9+**, **Node.js 18+**, and **MongoDB** (local community server or active Atlas URI) installed on your computer.

### Step 1: Clone & Configure Backend Variables
1. Open your terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Review the environment file `.env` (pre-configured to run locally out of the box):
   ```ini
   PORT=8000
   HOST=0.0.0.0
   MONGODB_URI=mongodb://localhost:27017
   DATABASE_NAME=domainspecificrag
   JWT_SECRET_KEY=94c8e75a96860d5b5467438e8cb50438cf38c4b9d03498ff2a5f7823f95e2fbd
   VECTOR_STORAGE_DIR=./vector_storage
   ```

### Step 2: Install Python Dependencies & Seed Database
1. Initialize a virtual environment and install backend requirements:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
2. **Pre-populate the system with 52 documents & 30 feedback items:**
   Run the master seeder script. This script dynamically writes 52 operational documents, inserts 30 feedback items into MongoDB, splits and embeds all files, and persistence-caches the RAG index:
   ```powershell
   python scripts/generate_samples.py
   ```

### Step 3: Launch the Backend FastAPI Server
1. Startup the server using Uvicorn:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```
2. Confirm the API is active by visiting: `http://localhost:8000/docs` (FastAPI Swagger UI).

### Step 4: Configure & Run the Frontend React Application
1. In a new terminal, navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install the npm packages:
   ```powershell
   npm install
   ```
3. Boot up the Vite hot-reloading development server:
   ```powershell
   npm run dev
   ```
4. Open your browser and navigate to the local address: `http://localhost:5173`.

---

## 💡 Placement Interview Talking Points Cheat Sheet

When showcasing this project during technical screenings, utilize these key architectural arguments to display senior-level capabilities:

1. **True Asynchronous Database Pipelines:** Emphasize that the backend avoids typical synchronous blockings by leveraging `FastAPI` context lifecycles paired with `motor` (the async client for MongoDB). This supports thousands of concurrent RAG queries without thread starvation.
2. **Authentic Local Evaluations:** Highlight that the dashboard graphs are *not* random mocks. Because a local `SentenceTransformer` runs on the server, we compute *real-time cosine similarities* of query-vs-context and response-vs-context, rendering **actual semantic accuracy scores** on every single chat prompt.
3. **Bulletproof Deployment Design:** Explain that instead of risking raw binary compilation failures with complex database engines on candidate or recruiter computers, you implemented a custom **pure-NumPy similarity matrix search fallback** matching exact mathematical representations of cosine distances, guaranteeing absolute local stability.
4. **JWT Role-Based Access Controls (RBAC):** Detail how the router locks upload and delete pipelines behind admin-level JWT checks, showcasing complete awareness of enterprise security practices.

---

## ☁️ Cloud Deployment Guidelines

Deploying this React + FastAPI full-stack system to the cloud is straightforward when utilizing Vercel for the user interface and Render/Railway for the API server.

### 1. Frontend Deployment (Vercel)
1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
3. Select your cloned repository.
4. **Important Settings:**
   - **Root Directory:** Set this to `frontend` (Vercel will automatically read the `frontend/vercel.json` we created to manage React routing rewrites!).
   - **Framework Preset:** Vite.
   - **Environment Variables:** Add `VITE_API_BASE_URL` pointing to your hosted FastAPI backend (e.g., `https://your-backend.onrender.com/api`).
5. Click **Deploy**. Your frontend will be live instantly!

### 2. Backend Deployment (Render or Railway)
Because our Python backend hosts a local **SentenceTransformer deep learning model** (~120MB) and performs local memory searches, hosting it on **Render** (Web Service) or **Railway** is highly recommended over Vercel Serverless (which limits function packages to 50MB):

1. **Deploy as a Web Service:**
   - Link your GitHub repository to Render/Railway.
   - Set the Root Directory to `backend`.
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. **Environment Variables:**
   - `MONGODB_URI`: Set to your cloud **MongoDB Atlas** cluster connection string.
   - `DATABASE_NAME`: `domainspecificrag`
   - `JWT_SECRET_KEY`: A secure random hex key string.
   - `VECTOR_STORAGE_DIR`: `./vector_storage`
3. Click **Deploy**. Your RAG backend is now globally connected!

