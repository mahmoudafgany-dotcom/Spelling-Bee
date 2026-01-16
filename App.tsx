import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Practice from './components/Practice';
import Completed from './components/Completed';
import { AppView, WordResult } from './types';
import { RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [words, setWords] = useState<string[]>([]);
  const [lastResults, setLastResults] = useState<WordResult[]>([]);

  const startPractice = (wordList: string[]) => {
    setWords(wordList);
    setView(AppView.PRACTICE);
  };

  const finishPractice = (results: WordResult[]) => {
    setLastResults(results);
    setView(AppView.COMPLETED);
  };

  const restart = () => {
    setWords([]);
    setLastResults([]);
    setView(AppView.HOME);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
      <Header />

      <main className="flex-grow flex flex-col items-center justify-start pt-4 pb-12 w-full">
        {view === AppView.HOME && (
          <Home onStart={startPractice} />
        )}

        {view === AppView.PRACTICE && (
          <>
            <div className="w-full max-w-2xl px-6 mb-4">
               <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm">
                 <p><strong>Instructions:</strong> I will pronounce a word. Click the <span className="inline-block align-middle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></span> Speaker icon to hear it again, then click the <span className="inline-block align-middle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></span> Microphone to spell it letter-by-letter.</p>
               </div>
            </div>
            <Practice words={words} onFinish={finishPractice} />
          </>
        )}

        {view === AppView.COMPLETED && (
          <Completed results={lastResults} onRestart={restart} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;