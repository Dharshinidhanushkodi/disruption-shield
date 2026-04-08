# 🛡️ DisruptionShield Coordinator

**AI-Powered Multi-Agent Disruption Recovery System**

DisruptionShield is a hackathon-winning productivity assistant designed to handle real-life interruptions (power cuts, traffic, sudden meetings) by intelligently re-planning your entire day. It uses a coordinated team of specialists to re-prioritize tasks, find new schedule slots, and learn from past patterns.

---

## 🚀 Key Features

1.  **Instant Disruption Logging:** Detects type, severity, and time lost from natural language.
2.  **Multi-Agent Recovery Protocol:** A chain of 4 specialized agents orchestrates the re-plan.
3.  **Smart Task Re-prioritization:** Re-ranks work using deadline urgency + impact scoring.
4.  **Conflict-Free Rescheduling:** Automatically shifts events with 15-minute buffers.
5.  **Pattern Analysis:** Detects recurring disruption slots and provides proactive warnings.
6.  **Premium UI:** Modern dark mode with real-time agent reasoning steps and animated alerts.

---

## 🛠️ Tech Stack

-   **Backend:** FastAPI (Python 3.10+)
-   **UI:** Chainlit (Modern, conversational interface)
-   **Database:** SQLite + SQLAlchemy 2.0 (Async)
-   **LLM:** Groq (Llama-3.3-70b) or OpenAI (GPT-4o)
-   **Styling:** Custom CSS with Deep Navy + Alert Red theme

---

## 📦 Setup Instructions

1.  **Clone the project:**
    ```bash
    git clone <repository-url>
    cd disruption-shield-coordinator
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`.
   - Add your `GROQ_API_KEY`.

4. **Launch the Core Assistant (Chainlit):**
   ```bash
   chainlit run app.py
   ```

5. **Launch the Dashboard (FastAPI):**
   ```bash
   python main.py
   # OR
   python dashboard_server.py
   ```
   *The dashboard will be available at `http://localhost:8001`.*

---

## 🎭 Demo Scripts (Impress the Judges!)

### Demo 1: The Sudden Power Cut (Dashboard View)
1. Open the dashboard at `http://localhost:8001`.
2. Click **🌱 /seed** in the sidebar to populate data.
3. Type: *"Power cut just happened, I lost 2 hours"*
4. **Observe:** Watch the Agent status cards on the left toggle from **Idle** to **Running** to **Done** as the multi-agent chain executes. Note the real-time stat updates.

### Demo 2: The Traffic Jam
1.  Type: *"Stuck in heavy traffic! I'm going to be 45 minutes late for everything today."*
2.  **Observe:** The system detects "Moderate" severity and shifts your entire timeline forward, resolving conflicts and deferring low-priority tasks if they push past 10 PM.

### Demo 3: Proactive Intelligence
1.  Type `/history` to see your past interruptions.
2.  Type `/patterns` to see insights.
3.  **Experience:** Refresh the app or start a new chat. If it's a Monday and you've had 3 power cuts on Mondays before, the system will lead with a **Proactive Alert** warning you to schedule critical work early.

---

## 📁 Folder Structure

```text
disruption-shield/
├── .chainlit/          # UI Config
├── agents/             # Coordinator + Specialists
├── models/             # SQLAlchemy 2.0 ORM Models
├── public/             # Custom CSS & Assets
├── tools/              # DB Tools (MCP-style)
├── app.py              # Main Chainlit App
├── main.py             # FastAPI Backend
├── config.py           # Configuration
├── database.py         # SQLAlchemy Engine
└── requirements.txt    # Dependencies
```

---
*Built with ❤️ for the AI productivity hackathon.*
