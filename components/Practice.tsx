
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { pronounceWord, checkSpelling } from '../services/geminiService';
import { blobToBase64, playAudioContent } from '../utils/audio';
import { SpellingFeedback } from '../types';

interface PracticeProps {
  words: string[];
  onFinish: () => void;
}

const Practice: React.FC<PracticeProps> = ({ words, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [feedback, setFeedback] = useState<SpellingFeedback | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const currentWord = words[currentIndex];
  const isFinished = currentIndex >= words.length;

  useEffect(() => {
    if (!isFinished && currentWord) {
      handlePronounce(currentWord);
    }
  }, [currentIndex]);

  const handlePronounce = async (word: string) => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      const audioData = await pronounceWord(word);
      if (audioData) {
        await playAudioContent(audioData);
      }
    } catch (err) {
      console.error("Pronunciation error", err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Standardize audio format if possible
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = MediaRecorder.isTypeSupported(options.mimeType) 
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please allow permissions in your browser settings.");
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
        
        // Stop all tracks to release the microphone
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
      console.error("Processing failed", error);
      setFeedback({
        isCorrect: false,
        heardSpelling: "Processing Error",
        feedbackText: "Something went wrong while checking your spelling. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-2xl font-bold">Practice Session Finished!</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl px-6 py-6 space-y-8 animate-fade-in">
      
      {/* Progress Bar */}
      <div className="w-full flex items-center justify-between text-sm font-medium text-gray-500 mb-4">
        <span>Word {currentIndex + 1} of {words.length}</span>
        <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="flex flex-col items-center space-y-6 w-full">
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-800">
            Listen and Spell
          </h3>
          <p className="text-gray-500">
            Press the speaker to hear the word, then the microphone to spell it.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => handlePronounce(currentWord)}
            disabled={isPlayingAudio || isRecording || isProcessing}
            className={`p-6 rounded-full shadow-xl transition-all ${
              isPlayingAudio 
                ? 'bg-blue-100 text-blue-400 scale-95' 
                : 'bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 border border-blue-100 disabled:opacity-50'
            }`}
            title="Hear Word"
          >
            <Volume2 className={`w-10 h-10 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
          </button>

          {!isRecording ? (
             <button
             onClick={startRecording}
             disabled={isProcessing || isPlayingAudio || (!!feedback && feedback.isCorrect)}
             className={`p-8 rounded-full shadow-2xl transition-all transform hover:scale-105 ${
               (feedback?.isCorrect) 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
             }`}
             title="Record Spelling"
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

        {/* Status Text */}
        <div className="h-8 text-center">
          {isRecording && <p className="text-red-500 font-semibold animate-pulse">Recording... Spell now!</p>}
          {isProcessing && <p className="text-blue-600 font-semibold animate-pulse">Judging your spelling...</p>}
        </div>
      </div>

      {/* Feedback Section */}
      {feedback && (
        <div className={`w-full p-6 rounded-xl border-2 animate-slide-up shadow-sm ${
          feedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-4">
            {feedback.isCorrect ? (
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            )}
            <div className="space-y-2 flex-grow">
              <h4 className={`text-lg font-bold ${feedback.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {feedback.isCorrect ? 'Excellent!' : 'Try Again'}
              </h4>
              <p className="text-gray-700 leading-relaxed font-medium">
                {feedback.feedbackText}
              </p>
              {!feedback.isCorrect && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-red-100">
                  <span className="font-bold text-gray-500 uppercase text-xs tracking-wider">I Heard:</span>
                  <p className="text-lg font-mono tracking-widest text-red-700 mt-1">{feedback.heardSpelling}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105 active:scale-95 ${
                feedback.isCorrect 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {currentIndex < words.length - 1 ? 'Next Word' : 'Finish Session'} 
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Practice;
