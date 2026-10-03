# HCI Individual Project

**Live demo:** https://rshamsini.github.io/AI_Chat_Interface/

## Overview

This project is a React/Vite implementation of an HCI prototype for organizing and finding past AI chat conversations. The design is based on the project report, [Individual_Project_Report.pdf](Individual_Project_Report.pdf), which studies the usability problems users face when chat histories become long, cluttered, and difficult to search.

The prototype focuses on improving the chat history experience for tools such as ChatGPT, Claude, and Gemini. Instead of changing the core conversational AI experience, it redesigns the surrounding organization and retrieval interface so users can recognize, group, search, and recover past conversations more easily.

## Problem Statement

AI chat tools are increasingly used for learning, coding, interview preparation, brainstorming, documentation, and work tasks. As usage grows, users accumulate many conversations with titles that often reflect only the first prompt, not the full context of the discussion. This makes it difficult to identify useful old chats, especially when several chats have similar titles or mixed topics.

The project addresses three main usability issues:

- Poor discoverability of existing organization features.
- Limited structure in long chronological chat lists.
- Weak feedback and visibility for important or relevant conversations.

## Prototype Features

- Timeline grouping for chats using sections such as Today, Yesterday, and Older.
- Project and folder-style organization for related conversations.
- Pinned, Favorite, Archive, and Recycle Bin sections.
- Chat Explorer with list and grid views.
- AI-generated dynamic titles and editable tags.
- Multi-topic indicators for conversations that shift between subjects.
- Keyword and tag-based search with clearer result context.
- Calendar and date-range filters, including quick filters such as Last 7 Days and Last 30 Days.
- Topic-switch detection to help users split unrelated topics into separate conversations.
- Onboarding prompts for lower-discoverability features.

## Research And Analysis Summary

The report used needfinding, heuristic evaluation, brainstorming, iterative prototyping, and survey-based evaluation.

Initial needfinding included 30 participants: 25 OMSCS students and 5 professional colleagues. The main findings were:

- 24 of 30 participants used AI chat tools frequently or very frequently.
- 19 of 30 described their current chat list as cluttered or very cluttered.
- 21 participants reported that identifying the correct old chat was frustrating.
- 20 participants reported frustration with too many or similar search results.
- 24 of 30 agreed that grouping chats into Today, Yesterday, and Older would be helpful.
- 21 of 30 agreed that a folder-style list view would be helpful.

The heuristic evaluation of the existing ChatGPT-style interface found that the interface is simple and consistent for recent chats, but becomes harder to use as chat history grows. Key issues included vague generated titles, limited structure, low visibility of Projects, and few strong visual indicators for important conversations.

## Evaluation Results

The first prototype evaluation used 20 participants and measured seven feature areas. All evaluated features were rated significantly above neutral using one-sample Wilcoxon Signed-Rank tests.

Positive response rates from the first evaluation:

- Timeline grouping: 80%
- Pin and Favorite actions: 75%
- List view with tags and previews: 85%
- Calendar retrieval: 75%
- Multi-topic tags: 75%
- Keyword/tag search: 85%
- AI title suggestions: 80%

The strongest first-iteration features were keyword/tag search and the list view with tags. Improvement areas included making pin/favorite actions more visible, adding date-range filtering, and clarifying whether AI-generated titles and tags are editable.

The final evaluation used 23 participants. Results showed 87% to 100% positive responses across all survey questions, with all Wilcoxon tests significant at p < 0.001.

Final evaluation highlights:

- Overall design understandability: 100% positive, mean 4.48/5.
- Feature discoverability: 100% positive, mean 4.30/5.
- AI titles and tags: 95.7% positive, mean 4.48/5.
- Chat Explorer views: 100% positive, mean 4.39/5.
- Calendar/date filters: 100% positive, mean 4.35/5.
- Improvement over existing interfaces: 87% positive, mean 4.13/5.

Qualitative feedback especially supported topic-switch detection, AI-generated titles and tags, structured browsing through Chat Explorer, and date-based grouping. Suggested future refinements included stronger color differentiation for tags and optional collapsing of sidebar sections.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Material UI
- Radix UI components
- Lucide icons
- Sonner toast notifications

## Project Structure

```text
.
|-- index.html
|-- package.json
|-- vite.config.ts
|-- src
|   |-- main.tsx
|   |-- app
|   |   |-- App.tsx
|   |   |-- components
|   |   |-- data
|   |   |   `-- chatData.ts
|   |-- styles
|       |-- index.css
|       |-- theme.css
|       |-- tailwind.css
|       `-- fonts.css
`-- Individual_Project_Report.pdf
```

## Setup Instructions

### Prerequisites

Install Node.js LTS for Windows:

https://nodejs.org/

After installing Node.js, reopen PowerShell or your IDE terminal so the `node` and `npm` commands are available.

Verify the installation:

```powershell
node --version
npm --version
```

### Install Dependencies

From the project folder:

```powershell
cd C:\Users\hamsi\HCI_Individual_Project
npm install
```

If PowerShell says `npm` is not recognized, reopen the terminal. If it still does not work, run npm using the full Node.js path:

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
```

### Run Locally

```powershell
npm run dev
```

Then open the local URL shown in the terminal, usually:

```text
http://127.0.0.1:5173/
```

### Build For Submission

```powershell
npm run build
```

### Preview The Production Build

```powershell
npm run preview
```

## Notes

This app was exported from Figma and adapted into a local Vite project. The prototype is intended for HCI demonstration and evaluation, so some interactions may use static or sample data from `src/app/data/chatData.ts` rather than a live backend.
