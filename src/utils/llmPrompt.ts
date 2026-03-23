export const LLM_PROMPT = `Generate a structured JSON study plan for learning [SUBJECT] over [N] weeks.

I will use this plan in a dashboard app that tracks my progress. The app supports:
- Any number of phases (logical units of the curriculum)
- Any number of weeks per phase
- Any number of study sessions (slots) per week — you decide how many based on my available time
- Multiple session types (e.g. "lecture", "practice", "reading") that get grouped in the UI
- Subtasks within each session that I can check off individually
- Links to course materials, videos, textbooks, papers, etc.

My available study time: [DESCRIBE YOUR SCHEDULE, e.g. "2 hours on the train 4 days a week, plus 1.5 hour evening sessions 3 days a week", or "2 hours every evening", or "weekends only"]

## JSON Schema

{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "totalWeeks": <number>,
  "schedule": {
    "description": "<describe the weekly rhythm in plain text>",
    "totalHoursPerWeek": <number>,
    "sessionStructures": {},
    "defaultDayMapping": {}
  },
  "resources": [
    { "name": "...", "url": "...", "category": "course|book|video|paper|reference", "phases": [1] }
  ],
  "phases": [
    {
      "id": "phase-1",
      "number": 1,
      "title": "...",
      "course": "...",
      "courseUrl": "...",
      "description": "Why this phase matters and what it covers",
      "bookChapters": "...",
      "bookDescription": "...",
      "weekRange": [1, 7],
      "completionNote": "Summary of what you can now do after completing this phase",
      "weeks": [
        {
          "id": "week-1",
          "weekNumber": 1,
          "dateRange": "24–30 March",
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD",
          "title": "Descriptive title for this week",
          "isBuffer": false,
          "slots": [
            {
              "id": "week-1-lecture-1",
              "type": "lecture",
              "slotNumber": 1,
              "label": "Lecture 1",
              "description": "Markdown description of what to study.",
              "isAdditionalContent": false,
              "estimatedMinutes": 120,
              "tags": [],
              "links": [{ "text": "Lecture 1: Topic", "url": "https://..." }],
              "subtasks": [
                { "id": "week-1-lecture-1-sub-1", "label": "Watch Lecture 1" },
                { "id": "week-1-lecture-1-sub-2", "label": "Take notes on key concepts" }
              ]
            },
            {
              "id": "week-1-practice-1",
              "type": "practice",
              "slotNumber": 1,
              "label": "Practice 1",
              "description": "Work through problem set 1.",
              "isAdditionalContent": false,
              "estimatedMinutes": 90,
              "tags": [],
              "links": [],
              "subtasks": [
                { "id": "week-1-practice-1-sub-1", "label": "Problems 1–5" },
                { "id": "week-1-practice-1-sub-2", "label": "Check solutions" }
              ]
            },
            {
              "id": "week-1-reading-1",
              "type": "reading",
              "slotNumber": 1,
              "label": "Reading 1",
              "description": "Textbook chapter 1. Connection: how this relates to the main topic.",
              "isAdditionalContent": true,
              "estimatedMinutes": 60,
              "tags": ["connection"],
              "links": [],
              "subtasks": [
                { "id": "week-1-reading-1-sub-1", "label": "Read chapter 1" },
                { "id": "week-1-reading-1-sub-2", "label": "Write connection paragraph" }
              ]
            }
          ]
        }
      ]
    }
  ]
}

## IMPORTANT Rules

Slot types and numbering:
- The "type" field groups slots by kind (e.g. "lecture", "practice", "reading", "review")
- Choose 2–4 types that make sense for the subject and the learner's schedule
- "slotNumber" is sequential PER TYPE within each week, starting at 1. If a week has 3 lectures and 2 practices, they are lecture-1, lecture-2, lecture-3, practice-1, practice-2
- Slot ID format: week-{weekNumber}-{type}-{slotNumber} (e.g. week-1-lecture-1, week-3-practice-2)
- Subtask ID format: {slotId}-sub-{N} (e.g. week-1-lecture-1-sub-1)
- Each slot MUST have at least one subtask (these become individual checkboxes)
- "isAdditionalContent": true for supplementary/parallel content (e.g. textbook reading alongside a video course, side projects). These slots get visually highlighted in the UI. Do NOT use "isBookSlot" — only "isAdditionalContent".
- "estimatedMinutes": how long this session should take
- Every week should have the same types and roughly the same number of slots (consistency helps scheduling)

Tags (optional, parsed by the UI):
- "critical" — marks high-importance content
- "connection" — slot description contains a "Connection:" paragraph linking concepts
- "key-exercise" — a particularly important exercise
- "checkpoint" — a self-assessment checkpoint
- "timed" — should be done under timed conditions
- "from-scratch" — derive/write from memory

Other:
- Include buffer/consolidation weeks periodically (isBuffer: true) for review and catching up
- Include direct links to course pages, lecture videos, problem sets, textbooks
- Use markdown in descriptions (**bold**, links, etc.)
- "weekRange" in each phase indicates which week numbers it spans [first, last]
- "resources" array at the top level lists all course materials used across the plan
- "schedule.description" should describe the weekly rhythm in plain English`;
