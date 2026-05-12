# CaterFlow - Setup Instructions

## ⚠️ CRITICAL: Security First

**NEVER commit these files to GitHub:**
- `.env` (contains sensitive credentials)
- `firebase-applet-config.json` (Firebase API keys)
- Any `.log` files
- `node_modules/` directory

**These are already in `.gitignore` - DO NOT remove them!**

---

## 1. Initial Setup

### Prerequisites
- Node.js 18+ 
- npm 9+
- MongoDB running locally or connection string
- Firebase project (free tier works)
- (Optional) Gemini API key for demo

### Install Dependencies
```bash
npm install
```

---

## 2. Firebase Configuration

### Get Your Firebase Config
1. Go to https://console.firebase.google.com
2. Select your project
3. Click ⚙️ Settings → Project settings
4. Scroll to "Your apps" and click "Config"
5. Copy the config object

### Create `firebase-applet-config.json`
**File: `firebase-applet-config.json`** (NOT in git)
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "your-cert-url",
  "firestoreDatabaseId": "(default)"
}
```

---

## 3. Environment Configuration

### Create `.env` file
**File: `.env`** (NOT in git)
```bash
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/caterflow

# Firebase (from firebase-applet-config.json)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Gemini API (optional, for demo)
GEMINI_API_KEY=your-gemini-key

# Microsoft Foundry (optional)
FOUNDRY_PROJECT_ENDPOINT=https://your-foundry-service.services.ai.azure.com/api/projects/your-project
FOUNDRY_MODEL=gpt-5.4-mini

# Azure AI Search (optional)
AZURE_AI_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_AI_SEARCH_KEY=your-search-key
AZURE_AI_SEARCH_INDEX=menus
```

---

## 4. Local MongoDB Setup

### Option A: Docker (Recommended)
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Update .env
MONGODB_URI=mongodb://admin:password@localhost:27017/caterflow
```

### Option B: Local Installation
- macOS: `brew install mongodb-community`
- Ubuntu: `sudo apt-get install -y mongodb`
- Windows: Download from https://www.mongodb.com/try/download/community

---

## 5. Run Development Server

```bash
npm run dev
```

Server starts at: **http://localhost:3000**

### Test the Server
```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-05-12T...",
  "mongodb": "connected"
}
```

---

## 6. API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/stack` - Tech stack status
- `GET /api/shops` - List all shops
- `POST /api/rag/search` - RAG search (public)

### Protected Endpoints (Require Firebase Auth Token)
- `POST /api/users` - Create/update user profile
- `GET /api/users/:uid` - Get user profile
- `GET /api/events` - List user's events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/chats/:eventId` - Get chat for event
- `POST /api/chats/:eventId/messages` - Send chat message
- `POST /api/foundry/orchestrate` - Foundry orchestration

### Authentication
All protected endpoints require Bearer token:
```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  http://localhost:3000/api/events
```

---

## 7. Build for Production

```bash
# Build React app
npm run build

# Build output goes to: dist/

# Set production environment
export NODE_ENV=production

# Start production server
npm start
```

---

## 8. Testing

```bash
# Run all tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 9. Deployment

### Heroku
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_URI="..."
heroku config:set GEMINI_API_KEY="..."
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t caterflow .
docker run -p 3000:3000 caterflow
```

---

## 10. Troubleshooting

### MongoDB Connection Failed
- Check MongoDB is running: `mongosh` or `mongo`
- Verify MONGODB_URI in .env
- Check credentials if using authentication

### Firebase Auth Errors
- Verify firebase-applet-config.json exists
- Check Firebase project ID matches
- Regenerate private key if needed

### API Keys Not Working
- Never commit .env file
- Check .gitignore includes .env
- Regenerate API keys in respective dashboards

### Port Already in Use
```bash
# Change port in .env
PORT=3001

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

---

## 11. Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `firebase-applet-config.json` is in `.gitignore`
- [ ] Never logged credentials in console.log
- [ ] Using HTTPS in production
- [ ] CORS restricted to known domains
- [ ] Rate limiting enabled (100 req/min)
- [ ] Payload size limited (5MB)
- [ ] All inputs validated
- [ ] Database has authentication
- [ ] Regular backups configured

---

## 12. Getting Help

- Issues: https://github.com/ElleBabaran/CaterFlow/issues
- Docs: See `/docs` folder
- Firebase: https://firebase.google.com/docs
- MongoDB: https://docs.mongodb.com
