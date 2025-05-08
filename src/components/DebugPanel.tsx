"use client";

import { useEffect, useState } from 'react';
import { useQuizStore } from '@/store/useQuizStore';

export function DebugPanel() {
  const quiz = useQuizStore(state => state.quiz);
  const quizList = useQuizStore(state => state.quizList);
  const [displayId, setDisplayId] = useState<string>('');
  const [elementCount, setElementCount] = useState<number>(0);
  const [screenCount, setScreenCount] = useState<number>(0);

  // Get information for display after component mounts to avoid hydration mismatch
  useEffect(() => {
    if (quiz) {
      setDisplayId(quiz.id);
      setScreenCount(quiz.screens.length);
      const currentScreen = quiz.screens[quiz.currentScreenIndex];
      if (currentScreen?.sections?.body) {
        let totalElements = 0;
        Object.values(currentScreen.sections).forEach(section => {
          totalElements += section.elements.length || 0;
        });
        setElementCount(totalElements);
      }
    }
  }, [quiz]);

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '10px 14px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'monospace',
        width: '320px',
        maxWidth: '100%',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid #444', paddingBottom: '4px' }}>
        Quiz Builder Debug Panel
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <div>Quiz ID: <span style={{ color: '#66d9ef' }}>{displayId}</span></div>
        <div>Screens: <span style={{ color: '#a6e22e' }}>{screenCount}</span></div>
        <div>Elements on current screen: <span style={{ color: '#a6e22e' }}>{elementCount}</span></div>
        <div>Total quizzes: <span style={{ color: '#a6e22e' }}>{quizList?.length || 0}</span></div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <button
          onClick={() => {
            try {
              const keys = Object.keys(localStorage)
                .filter(key => key.startsWith('quiz-builder-'));
              
              const storageInfo = {
                persistKey: localStorage.getItem('quiz-builder-storage'),
                quizListKey: localStorage.getItem('quiz-builder-quizlist'),
                currentQuizId: quiz?.id,
                currentQuizData: quiz?.id ? localStorage.getItem(`quiz-builder-quiz-${quiz.id}`) !== null : false,
                totalKeys: keys.length,
                keys
              };
              
              console.log('Storage Debug Info:', storageInfo);
              alert(`Found ${keys.length} quiz-related items in localStorage`);
            } catch (e: unknown) {
              alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
            }
          }}
          style={{
            backgroundColor: '#444',
            border: 'none',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Check Storage
        </button>
        
        <button
          onClick={() => {
            try {
              // Force reload the current quiz from storage
              if (quiz?.id) {
                const quizId = quiz.id;
                const key = `quiz-builder-quiz-${quizId}`;
                const stored = localStorage.getItem(key);
                
                if (stored) {
                  const parsedQuiz = JSON.parse(stored);
                  useQuizStore.setState({
                    quiz: parsedQuiz,
                    history: {
                      past: [],
                      present: parsedQuiz,
                      future: []
                    },
                    selectedElementIds: [],
                    selectedSectionId: null
                  });
                  alert(`Reloaded quiz ${quizId} from storage`);
                } else {
                  alert(`No quiz with ID ${quizId} found in storage`);
                }
              } else {
                alert('No active quiz to reload');
              }
            } catch (e: unknown) {
              alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
            }
          }}
          style={{
            backgroundColor: '#444',
            border: 'none',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Reload Quiz
        </button>
      </div>
      
      <div style={{ borderTop: '1px solid #444', paddingTop: '8px' }}>
        <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Available Quizzes:</div>
        <div style={{ maxHeight: '100px', overflowY: 'auto', paddingRight: '4px' }}>
          {quizList && quizList.length > 0 ? (
            quizList.map((quizItem) => (
              <div 
                key={quizItem.id} 
                style={{ 
                  fontSize: '10px', 
                  padding: '4px',
                  marginBottom: '2px',
                  backgroundColor: quiz?.id === quizItem.id ? '#2a3834' : 'transparent',
                  borderRadius: '2px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{quizItem.name}</span>
                <button
                  onClick={() => {
                    const loadQuiz = useQuizStore.getState().loadQuiz;
                    loadQuiz(quizItem.id);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#66d9ef',
                    cursor: 'pointer',
                    fontSize: '10px',
                    padding: '0',
                    textDecoration: 'underline'
                  }}
                >
                  Load
                </button>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '10px', color: '#999' }}>No quizzes available</div>
          )}
        </div>
      </div>
    </div>
  );
} 