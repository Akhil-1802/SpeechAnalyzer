# Speech Analyzer

An AI-powered speech analysis platform that helps users improve their public speaking skills through automated transcription, evaluation, and personalized feedback.

## 🚀 Live Demo

Check out the live application: [https://speechanalyzer.netlify.app/](https://speechanalyzer.netlify.app/)

## ✨ Features

- **Speech Recording**: Record 1-minute impromptu speeches on various topics
- **AI Transcription**: Automatic speech-to-text conversion using Whisper AI
- **Intelligent Evaluation**: AI-powered speech analysis with scoring (1-10)
- **Detailed Feedback**: Get comprehensive feedback on topic relevance, structure, clarity, fluency, and more
- **Speech History**: Track your progress with a complete history of analyzed speeches
- **User Authentication**: Secure registration and login with JWT tokens
- **Real-time Analysis**: Fast processing with background task management

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React Frontend│◄────────┤  FastAPI Backend│◄────────┤   MongoDB       │
│   (TypeScript)  │  HTTP   │    (Python)     │  Driver │   Database      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   External APIs     │
                          │  • Whisper AI       │
                          │  • Mistral AI       │
                          └─────────────────────┘
```

### Backend Architecture

**Technology Stack:**
- **Framework**: FastAPI (Python 3.x)
- **Database**: MongoDB (via Motor - async driver)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Rate Limiting**: slowapi for API protection
- **AI Services**:
  - faster-whisper for speech transcription
  - Mistral AI (via LangChain) for speech evaluation

**Directory Structure:**
```
backend/
├── main.py              # FastAPI application & API endpoints
├── auth.py              # Authentication logic (JWT, password hashing)
├── requirements.txt     # Python dependencies
├── models/              # Pydantic data models
│   ├── speech.py        # Speech record model
│   └── user.py          # User model
├── utils/               # Utility functions
│   └── transcript.py    # Whisper transcription logic
├── helper/              # AI integration
│   └── model.py         # Mistral AI evaluation logic
├── db/                  # Database configuration
└── uploads/             # Temporary audio file storage
```

**API Endpoints:**

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/` | GET | Health check | None |
| `/auth/register` | POST | User registration | None |
| `/auth/login` | POST | User login | None |
| `/upload-audio` | POST | Upload speech audio | Required |
| `/result/{record_id}` | GET | Get analysis results | Required |
| `/history` | GET | Get user speech history | Required |

**Key Features:**
- **Rate Limiting**: Protects against API abuse (5-30 requests/minute per endpoint)
- **CORS Enabled**: Allows cross-origin requests from frontend
- **Background Tasks**: Automatic cleanup of uploaded audio files after 5 minutes
- **Async Processing**: Non-blocking I/O with Motor for MongoDB
- **Secure Authentication**: JWT tokens with configurable expiration

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: TailwindCSS v4
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **State Management**: React Context API

**Directory Structure:**
```
frontend/
├── src/
│   ├── main.tsx          # Application entry point
│   ├── App.tsx           # Main app component with routing
│   ├── config.ts         # API configuration
│   ├── index.css         # Global styles
│   ├── assets/           # Static assets
│   ├── components/       # Reusable components
│   │   └── ProtectedRoute.tsx  # Authentication wrapper
│   ├── context/          # React Context providers
│   │   └── AuthContext.tsx     # Authentication state
│   ├── pages/            # Page components
│   │   ├── Home.tsx      # Landing page
│   │   ├── Auth.tsx      # Login/Register page
│   │   ├── Speech.tsx    # Speech recording page
│   │   ├── Typing.tsx    # Alternative input page
│   │   ├── Result.tsx    # Results display page
│   │   └── History.tsx   # Speech history page
│   └── utils/            # Utility functions
├── public/               # Public assets
└── package.json          # Dependencies
```

**Page Routes:**
- `/` - Home page (landing)
- `/auth` - Authentication (login/register)
- `/speech/:topic` - Record speech on a specific topic (protected)
- `/typing/:topic` - Alternative input method (protected)
- `/result/:record_id` - View analysis results (protected)
- `/history` - View speech history (protected)

**Key Features:**
- **Protected Routes**: Authentication required for sensitive pages
- **Context API**: Global authentication state management
- **Responsive Design**: Mobile-friendly UI with TailwindCSS
- **Smooth Animations**: Enhanced UX with Framer Motion

## 🔄 Data Flow

### Speech Analysis Pipeline

1. **User Records Speech**
   - Frontend captures audio via browser media APIs
   - Audio file uploaded to `/upload-audio` endpoint

2. **Backend Processing**
   - Audio file saved temporarily (auto-deleted after 5 minutes)
   - Whisper AI transcribes audio to text
   - Mistral AI evaluates transcript based on topic

3. **AI Evaluation**
   - Score (1-10) based on: topic relevance, opening, structure, clarity, content density, fluency, conclusion
   - One-sentence summary
   - 3-4 sentences of detailed feedback

4. **Result Storage**
   - Complete record stored in MongoDB
   - Includes: transcript, score, summary, feedback, topic, timestamp

5. **Result Retrieval**
   - Frontend polls `/result/{record_id}` endpoint
   - Results displayed when ready

## 🛠️ Installation & Setup

### Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB instance (local or cloud)
- API keys:
  - Mistral AI API key
  - JWT secret key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/speechanalyzer
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
MISTRAL_API_KEY=your-mistral-api-key
```

5. Run the server:
```bash
uvicorn main:app --reload
```

Backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update API base URL in `src/config.ts`:
```typescript
const API_BASE = "http://localhost:8000";
```

4. Run development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🚀 Deployment

### Frontend (Netlify)

The frontend is configured for Netlify deployment via `netlify.toml`:

```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

### Backend (Render)

The backend is deployed on Render. Ensure the following environment variables are configured:
- `MONGODB_URI`
- `JWT_SECRET`
- `MISTRAL_API_KEY`

## 📊 AI Evaluation Criteria

The Mistral AI model evaluates speeches based on:

1. **Topic Relevance**: How well the speech addresses the given topic
2. **Opening**: Effectiveness of the introduction
3. **Structure**: Logical organization of content
4. **Clarity**: How clear and understandable the speech is
5. **Content Density**: Amount of meaningful information delivered
6. **Fluency**: Smoothness of delivery
7. **Conclusion**: Effectiveness of the ending

## 🔒 Security Features

- **Password Hashing**: bcrypt with automatic salt generation
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against API abuse
- **CORS Configuration**: Controlled cross-origin access
- **File Cleanup**: Automatic deletion of temporary audio files
- **Protected Routes**: Frontend route guards for authenticated pages

## 🧪 Testing

The application includes rate limiting to ensure stable performance:
- Registration: 5 requests/minute
- Login: 10 requests/minute
- Audio upload: 5 requests/minute
- Result polling: 30 requests/minute
- History: 10 requests/minute

## 📝 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, please open an issue on the repository.

---

**Built with ❤️ using React, FastAPI, and AI**
