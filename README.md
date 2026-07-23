# StudyPlanner

StudyPlanner is an AI-powered web application designed to help students organize their study schedules efficiently. By combining personalized AI-generated study plans, progress tracking, a Pomodoro timer, and smart resource recommendations, we aim to make studying more structured, productive, and engaging.

---

## Features

- AI-generated personalized study plans
- Google Sign-In authentication
- Progress tracking for study plans
- Pomodoro timer for focused study sessions
- Smart study resource recommendations
- Save and manage multiple study plans
- Responsive and user-friendly interface

---

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- FastAPI
- Python

### Database
- SQLite
- SQLAlchemy ORM

### AI
- Google Gemini API

### Authentication
- Google Sign-In

---

## Project Structure

```
StudyPlanner
│
├── Frontend
│   ├── index.html
│   ├── timer.html
│   ├── styles.css
│   ├── landing-styles.css
│   ├── script.js
│   └── landing-script.js
│
├── Backend
│   ├── geminiapp.py
│   ├── requirements.txt
│   ├── studyplanner.db
│   └── .gitignore
│
└── README.md
```

---

## How It Works

1. Users sign in using their Google account.
2. They provide their study goals, subjects, tasks, and available study time.
3. The backend sends the information to the Gemini API.
4. Gemini generates a personalized study plan.
5. The generated plan is stored in a SQLite database.
6. Users can track their progress by marking completed tasks.
7. The Pomodoro timer helps maintain focused study sessions.

---

## Installation

### Clone the repository

```bash
git clone <repository-url>
cd StudyPlanner
```

### Install dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### Configure Gemini API

Create an environment variable for your Gemini API key or add it to your backend configuration.

Example:

```python
GEMINI_API_KEY = "YOUR_API_KEY"
```

### Run the backend

```bash
uvicorn geminiapp:app --reload
```

### Open the frontend

Open `Frontend/index.html` in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/save-plan` | Save a study plan |
| GET | `/api/...` | Retrieve study plans |
| PUT | `/api/...` | Update study progress |
| DELETE | `/api/...` | Delete a study plan |

---

## Database

The application uses SQLite with SQLAlchemy ORM.

The database stores:

- User email
- Study plan name
- Tasks
- Available study time
- AI-generated study plan
- Progress percentage
- Completed tasks
- Timestamp

---

## Key Highlights

- AI-powered study planning
- FastAPI REST backend
- SQLite database integration
- Google Authentication
- Progress tracking
- Responsive UI
- Modular architecture
- Easy to extend and maintain

---

## Future Enhancements

- Calendar integration
- Email reminders
- Daily study streaks
- Performance analytics dashboard
- Mobile application
- Cloud database support
- Multi-user collaboration
- Export study plans as PDF

---

## Contributors

This project was collaboratively designed and developed by the project team. We worked together on planning, development, testing, and integration to build an AI-powered study management platform.

---

## License

This project is intended for educational and learning purposes.
