import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface HomeProps {
  onStart: (words: string[]) => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    // Split by comma or whitespace, remove empty strings
    const words = inputText
      .split(/[\s,]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (words.length === 0) {
      setError('Please enter at least one word to practice.');
      return;
    }

    onStart(words);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl px-6 py-10 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-800">Ready to Practice?</h3>
        <p className="text-gray-600">
          Add all the words you need to practice in the box below, separate them with a space or a comma.
        </p>
      </div>

      <div className="w-full space-y-2">
        <textarea
          className="w-full p-4 h-40 border-2 border-blue-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-lg resize-none placeholder-gray-400"
          placeholder="example: apple, banana, geography, science"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setError('');
          }}
        />
        {error && <p className="text-red-500 text-sm font-medium ml-1">{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-10 rounded-full shadow-lg transform transition-all hover:scale-105 active:scale-95"
      >
        <Play className="w-6 h-6 fill-current" />
        START PRACTICING
      </button>
    </div>
  );
};

export default Home;