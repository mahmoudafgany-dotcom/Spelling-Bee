import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, ArrowRight, CheckCircle, XCircle, BookOpen, MessageSquareQuote } from 'lucide-react';
import { pronounceWord, pronounceSentence, checkSpelling, getWordMetadata } from '../services/geminiService';
import { blobToBase64, playAudioContent } from '../utils/audio';
import { SpellingFeedback, WordMetadata, WordResult } from '../types';

interface PracticeProps {
  words: string[];
  onFinish: (results: WordResult[]) => void;
}

const Practice: React.FC<PracticeProps> = ({ words, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingSentence, setIsPlayingSentence] = useState(false);
  const [metadata, setMetadata] = useState<WordMetadata | null>(null);
  const [feedback, setFeedback] = useState<SpellingFeedback | null>(null);
  const [results, setResults] = useState<WordResult[]>([]);
  
  // Cache state to store audio data associated with specific text
  const [audioCache, setAudioCache] = useState<{ text: string; data: string } | null>(null);
  const [sentenceCache, setSentenceCache] = useState<{ text: string; data: string } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const currentWord = words[currentIndex];
  // Calculate isFinished based on results length to prevent premature rendering
  const isFinished = results.length === words.length && words.length > 0;

  useEffect(() => {
    if (!isFinished && currentWord) {
      handleLoadWord(currentWord);
    }
  }, [currentIndex]);

  const handleLoadWord = async (word: string) => {
    setMetadata(null);
    setFeedback(null);
    // Don't clear cache explicitly here; let handlePronounce overwrite it if key doesn't match.
    handlePronounce(word);
    
    try {
      const data = await getWordMetadata(word);
      setMetadata(data);
    } catch (err) {
      console.error("Failed to load metadata", err);
    }
  };

  const handlePronounce = async (word: string) => {
    if (isPlayingAudio || isPlayingSentence) return;

    // Check if we have valid cached audio for this word
    if (audioCache && audioCache.text === word) {
      setIsPlayingAudio(true);
      try {
        await playAudioContent(audioCache.data);
      } catch (err) {
        console.error("Playback error", err);
      } finally {
        setIsPlayingAudio(false);
      }
      return;
    }

    setIsPlayingAudio(true);
    try {
      const audioData = await pronounceWord(word);
      if (audioData) {
        setAudioCache({ text: word, data: audioData });
        await playAudioContent(audioData);
      }
    } catch (err) {
      console.error("Pronunciation error", err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handlePlaySentence = async () => {
    const sentence = metadata?.sentence;
    if (!sentence || isPlayingAudio || isPlayingSentence) return;
    
    // Check if we have valid cached audio for this sentence
    if (sentenceCache && sentenceCache.text === sentence) {
      setIsPlayingSentence(true);
      try {
        await playAudioContent(sentenceCache.data);
      } catch (err) {
        console.error("Playback error", err);
      } finally {
        setIsPlayingSentence(false);
      }
      return;
    }

    setIsPlayingSentence(true);
    try {
      const audioData = await pronounceSentence(sentence);
      if (audioData) {
        setSentenceCache({ text: sentence, data: audioData });
        await playAudioContent(audioData);
      }
    } catch (err) {
      console.error("Sentence pronunciation error", err);
    } finally {
      setIsPlayingSentence(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = MediaRecorder.isTypeSupported(options.mimeType) 
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);

      mediaRecorderRef.current.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        await processAudio(blob);
      };
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const result = await checkSpelling(currentWord, base64Audio, audioBlob.type);
      setFeedback(result);
    } catch (error) {
      setFeedback({
        isCorrect: false,
        isSilent: false,
        heardSpelling: "Error",
        letterAnalysis: [],
        feedbackText: "Something went wrong while checking your spelling."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    // Record the result of the current word
    const currentResult: WordResult = {
      word: currentWord,
      isCorrect: feedback?.isCorrect ?? false,
      userSpelling: feedback?.heardSpelling ?? '',
    };
    
    const updatedResults = [...results, currentResult];
    setResults(updatedResults);

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFeedback(null);
    } else {
      onFinish(updatedResults);
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h3 className="text-2xl font-bold text-gray-700">Finalizing Results...</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl px-6 py-4 space-y-6 animate-fade-in">
      
      {/* Progress Bar */}
      <div className="w-full flex items-center justify-between text-sm font-medium text-gray-500 mb-2">
        <span>Word {currentIndex + 1} of {words.length}</span>
        <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} />
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="flex flex-col items-center space-y-6 w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center space-y-4 w-full">
          <h3 className="text-xl font-semibold text-gray-800">Listen and Spell</h3>
          
          <div className="relative group mx-auto w-full max-w-lg">
            <div className="flex flex-col gap-4 bg-gray-50 px-6 py-6 rounded-2xl border border-gray-200 transition-all">
              {metadata ? (
                <>
                  <div className="flex flex-col items-center gap-2 border-b border-gray-200 pb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-widest">
                      {metadata.partOfSpeech}
                    </span>
                  </div>
                  
                  <div className="space-y-4 text-left">
                    <div className="flex gap-3">
                      <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Definition</span>
                        <p className="text-gray-700 text-sm font-medium">{metadata.definition}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[120px] gap-3 text-gray-400">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-sm font-medium animate-pulse">Gathering word context...</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-500 text-sm italic">
            Listen to the word or sentence, then record your spelling.
          </p>
        </div>

        <div className="flex items-center gap-6 py-2">
          {/* Hear Word Button */}
          <button
            onClick={() => handlePronounce(currentWord)}
            disabled={isPlayingAudio || isPlayingSentence || isRecording || isProcessing}
            className={`p-6 rounded-full shadow-lg transition-all ${
              isPlayingAudio ? 'bg-blue-100 text-blue-400 scale-95' : 'bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 border border-blue-100 disabled:opacity-50'
            }`}
            title="Hear Word"
          >
            <Volume2 className={`w-10 h-10 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
          </button>

          {/* Hear Sentence Button */}
          <button
            onClick={handlePlaySentence}
            disabled={!metadata?.sentence || isPlayingAudio || isPlayingSentence || isRecording || isProcessing}
            className={`p-6 rounded-full shadow-lg transition-all ${
              isPlayingSentence ? 'bg-indigo-100 text-indigo-400 scale-95' : 'bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-105 border border-indigo-100 disabled:opacity-50'
            }`}
            title="Hear Example Sentence"
          >
            <MessageSquareQuote className={`w-10 h-10 ${isPlayingSentence ? 'animate-pulse' : ''}`} />
          </button>

          {/* Record Button */}
          {!isRecording ? (
             <button
              onClick={startRecording}
              disabled={isProcessing || isPlayingAudio || isPlayingSentence || (!!feedback && feedback.isCorrect)}
              className={`p-8 rounded-full shadow-2xl transition-all transform hover:scale-105 ${
                (feedback?.isCorrect) ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
              }`}
              title="Start Recording"
            >
              <Mic className="w-12 h-12" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="p-8 rounded-full shadow-2xl bg-red-500 text-white animate-pulse transform hover:scale-105 hover:bg-red-600"
              title="Stop Recording"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-sm" />
              </div>
            </button>
          )}
        </div>

        <div className="h-6 text-center">
          {isRecording && <p className="text-red-500 font-semibold animate-pulse">Recording... Spell now!</p>}
          {isProcessing && <p className="text-blue-600 font-semibold animate-pulse">Checking your spelling...</p>}
        </div>
      </div>

      {feedback && (
        <div className={`w-full p-6 rounded-2xl border-2 animate-slide-up shadow-lg ${
          feedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              {feedback.isCorrect ? (
                <CheckCircle className="w-10 h-10 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600 flex-shrink-0" />
              )}
              <div className="space-y-2 flex-grow">
                <h4 className={`text-xl font-bold ${feedback.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {feedback.isSilent ? "Silence Detected" : (feedback.isCorrect ? 'Excellent!' : 'Keep Practicing!')}
                </h4>
                <p className="text-gray-700 leading-relaxed font-medium">
                  {feedback.feedbackText}
                </p>
              </div>
            </div>

            {!feedback.isSilent && feedback.letterAnalysis && feedback.letterAnalysis.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-inner">
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Word:</span>
                    <div className="flex flex-wrap gap-2">
                      {feedback.letterAnalysis.map((item, i) => (
                        <div key={i} className={`
                          w-10 h-12 flex items-center justify-center text-xl font-bold rounded-lg border-2
                          ${item.status === 'correct' ? 'bg-green-50 border-green-400 text-green-700' : 
                            item.status === 'incorrect' ? 'bg-red-50 border-red-400 text-red-700' : 
                            'bg-gray-50 border-gray-200 text-gray-400 italic line-through'}
                        `}>
                          {item.letter}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {!feedback.isCorrect && (
                    <div className="pt-4 border-t border-gray-50">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">I Heard:</span>
                      <p className="text-2xl font-mono tracking-[0.3em] text-red-600 mt-1 font-black">
                        {feedback.heardSpelling || "—"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 active:scale-95 shadow-md ${
                  feedback.isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {currentIndex < words.length - 1 ? 'Next Word' : 'Finish Session'} 
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Practice;