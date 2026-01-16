import React from 'react';
import { WordResult } from '../types';
import { RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface CompletedProps {
  results: WordResult[];
  onRestart: () => void;
}

const Completed: React.FC<CompletedProps> = ({ results, onRestart }) => {
  const correctCount = results.filter(r => r.isCorrect).length;
  const total = results.length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Determine encouragement based on score
  let message = "Good effort!";
  let messageColor = "text-blue-900";
  if (percentage === 100) {
    message = "Perfect Score! Amazing job!";
    messageColor = "text-green-700";
  } else if (percentage >= 80) {
    message = "Great work! You're doing very well.";
    messageColor = "text-green-600";
  } else if (percentage < 50) {
    message = "Keep practicing, you'll get there!";
    messageColor = "text-orange-600";
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl px-6 py-10 space-y-8 animate-fade-in">
      
      {/* Score Summary Card */}
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full text-center border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Practice Complete!</h2>
        <p className={`text-lg font-medium ${messageColor} mb-6`}>{message}</p>
        
        <div className="flex justify-center items-center gap-6 mb-2">
          <div className="flex flex-col">
             <span className="text-5xl font-black text-blue-600">{percentage}%</span>
             <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Score</span>
          </div>
          <div className="w-px h-16 bg-gray-200"></div>
          <div className="flex flex-col">
             <span className="text-5xl font-black text-gray-700">{correctCount}<span className="text-2xl text-gray-400">/{total}</span></span>
             <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Correct Words</span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="w-full space-y-4">
        <h3 className="text-xl font-bold text-gray-800 ml-2">Session History</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${!result.isCorrect ? 'bg-red-50 hover:bg-red-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                {result.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className={`font-bold text-lg ${result.isCorrect ? 'text-gray-800' : 'text-red-700'}`}>
                    {result.word}
                  </span>
                  {!result.isCorrect && (
                    <span className="text-sm text-red-500">
                      You said: <span className="font-mono font-medium">"{result.userSpelling}"</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase">
                {result.isCorrect ? 'Correct' : 'Incorrect'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <RotateCcw className="w-5 h-5" />
        Practice New List
      </button>
    </div>
  );
};

export default Completed;