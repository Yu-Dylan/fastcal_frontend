# FastCal User Journey

## Overview

FastCal is a natural language calendar assistant that integrates directly with Google Calendar. Users interact through a conversational chat interface to create, search, and manage calendar events using everyday language.

## Initial Setup

When a user first opens FastCal, they see a clean login screen with a "Sign in with Google" button. After clicking it, they're redirected to Google's OAuth flow where they authorize FastCal to access their Google Calendar. Once authenticated, they're brought back to the main application interface.

## Main Interface

The interface is split into two panels with a dark, ChatGPT-like theme:

- **Left Panel**: Displays the user's calendar in a compact timeline view, showing events from Google Calendar (blue bars) sorted chronologically. Each event shows the date/time on the left, event title, and location. Hovering over an event reveals a delete button.

- **Right Panel**: A chat interface where users interact with the AI assistant using natural language.

## Typical User Flow

### Creating Events

A user types "Lunch with John tomorrow at 2pm" in the chat. The AI assistant (powered by Gemini) parses the request and responds with a preview: "I want to create: 'Lunch with John'" showing the parsed details. The user clicks "Accept" to confirm. The event is immediately:
1. Created as a local draft in MongoDB
2. Synced to Google Calendar via the API
3. The local draft is deleted (to avoid duplicates)
4. After a 2-second delay, the calendar refreshes and shows the new event in blue

The entire process is seamless, and the user sees their event appear in the left panel within seconds.

### Searching Events

A user wants to find all their lunch meetings. They type "pull up all lunch meetings" in the chat. The AI:
1. Fetches all Google Calendar events in the next 30 days
2. Uses semantic search to identify lunch-related events
3. Responds with "Found 3 matching events in the next 30 days (through 11/27/2025). Filtering calendar view..."
4. The left panel filters to show only the matching events

Users can specify custom time ranges: "show me events next week" or "find meetings in December" and the AI will parse the time frame and search accordingly.

### Deleting Events

To delete an event, users can either:
1. **Via chat**: Type "delete event 1" and the AI identifies the event by its position in the list, then removes it from Google Calendar
2. **Via button**: Hover over any event in the left panel and click the delete icon

After deletion, the calendar refreshes automatically to reflect the change.

### Querying Calendar

Users can ask questions about their calendar:
- "How many events do I have?" → AI counts and responds
- "Do I have anything tomorrow?" → AI checks and answers yes/no

The AI distinguishes between queries (which just answer questions) and searches (which filter the calendar view).

## Key Features

- **Natural Language Processing**: Powered by Gemini AI to understand conversational requests
- **Google Calendar Integration**: Full OAuth 2.0 authentication and bidirectional sync
- **Semantic Search**: Find events by meaning, not just keywords (e.g., "lunches" matches "Lunch with John", "Team Lunch", etc.)
- **Time Frame Awareness**: Explicitly shows search windows and allows custom date ranges
- **Real-time Updates**: Calendar refreshes automatically after create/delete operations
- **Dark Theme**: Modern, ChatGPT-inspired UI with clean typography
- **Clickable Events**: Google Calendar events link directly to the event in Google Calendar

## Technical Flow

1. User types a message → Frontend sends to IntentParser API
2. IntentParser uses Gemini to classify intent (create/edit/delete/query/search)
3. For create: EventDrafts API creates draft → CalendarSync API syncs to Google → Local draft deleted
4. For search: Gemini analyzes existing events and returns matching IDs → Frontend filters calendar view
5. For delete: CalendarSync API deletes from Google Calendar → Frontend refreshes after 1s delay
6. All operations update the UI reactively without page reloads
