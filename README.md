# SimpleBuilder - Interactive Quiz/Survey Web Builder

A powerful web-based quiz and survey builder with live code editing capabilities, built with React 18, Next.js 14, and ShadCN UI.

## Features

- **Web-Based Quiz Builder**: Drag and drop elements to create interactive quizzes and surveys
- **Real-Time HTML & CSS Editing**: Edit code directly and see changes instantly in the UI
- **Two-Way Sync**: Changes in the visual editor reflect in the code editor and vice versa
- **Quiz Logic & Branching**: Configure conditional logic for quiz flow
- **Mobile-Responsive Layout**: Preview and test quizzes across different device sizes
- **Holy Grail Layout**: Structured interface with intuitive navigation

## Tech Stack

- **Frontend**: React 18, Next.js 14 (App Router)
- **UI Library**: ShadCN (Zinc Theme)
- **Code Editor**: Monaco Editor (VS Code engine)
- **State Management**: Zustand
- **Drag & Drop**: dnd-kit
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/simplebuilder.git
cd simplebuilder
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
simplebuilder/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/
│   │   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   │   ├── quiz-builder/    # Quiz builder components
│   │   └── ui/              # ShadCN UI components
│   ├── lib/                 # Utility functions
│   ├── store/               # Zustand store
│   └── types/               # TypeScript types
├── public/                  # Static assets
└── ...
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [dnd kit](https://dndkit.com/)
