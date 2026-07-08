import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, RefreshCcw, Award } from 'lucide-react';

export default function QuizEngine({ quizData, onComplete }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (!quizData || quizData.length === 0) return null;

  const currentQuestion = quizData[currentQuestionIdx];
  const isMultipleChoice = currentQuestion.type === 'multiple-choice';

  const handleAnswerSelect = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    let correctIdx;
    if (isMultipleChoice) {
      correctIdx = parseInt(currentQuestion.correctAnswer, 10);
    } else {
      const val = currentQuestion.correctAnswer;
      correctIdx = (val === true || String(val).toLowerCase() === 'true') ? 0 : 1;
    }

    if (index === correctIdx) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < quizData.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      if (onComplete) {
        onComplete({
          score,
          total: quizData.length,
          percentage: Math.round((score / quizData.length) * 100)
        });
      }
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  if (showResults) {
    const percentage = Math.round((score / quizData.length) * 100);
    const passed = percentage >= 70;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto shadow-sm text-center"
      >
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
          {passed ? <Award size={40} /> : <XCircle size={40} />}
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          {passed ? 'Great Job!' : 'Keep Trying!'}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 font-medium mb-6">
          You scored <span className="font-bold text-slate-800 dark:text-slate-200">{score} out of {quizData.length}</span> ({percentage}%)
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={handleRetry}
            className="flex items-center justify-center px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors"
          >
            <RefreshCcw size={18} className="mr-2" /> Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  const options = isMultipleChoice 
    ? currentQuestion.options 
    : ['True', 'False'];

  let correctIndex;
  if (isMultipleChoice) {
    correctIndex = parseInt(currentQuestion.correctAnswer, 10);
  } else {
    const val = currentQuestion.correctAnswer;
    correctIndex = (val === true || String(val).toLowerCase() === 'true') ? 0 : 1;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Knowledge Check</span>
        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
          Question {currentQuestionIdx + 1} of {quizData.length}
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-blue-600 dark:bg-yellow-400 transition-all duration-500 ease-out"
          style={{ width: `${((currentQuestionIdx) / quizData.length) * 100}%` }}
        />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-8 leading-relaxed">
        {currentQuestion.question}
      </h3>

      <div className="space-y-3 mb-8">
        {options.map((opt, idx) => {
          let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex items-center justify-between ";
          
          if (!isAnswered) {
            buttonClass += "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-yellow-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 cursor-pointer";
          } else {
            if (idx === correctIndex) {
              buttonClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
            } else if (idx === selectedAnswer && idx !== correctIndex) {
              buttonClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300";
            } else {
              buttonClass += "border-slate-200 dark:border-slate-800 opacity-50 text-slate-500";
            }
          }

          return (
            <button 
              key={idx}
              onClick={() => handleAnswerSelect(idx)}
              disabled={isAnswered}
              className={buttonClass}
            >
              <span className="flex-1">{opt}</span>
              {isAnswered && idx === correctIndex && <CheckCircle2 className="text-green-500 ml-3 shrink-0" size={20} />}
              {isAnswered && idx === selectedAnswer && idx !== correctIndex && <XCircle className="text-red-500 ml-3 shrink-0" size={20} />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 rounded-xl mb-6 text-sm leading-relaxed ${
              selectedAnswer === correctIndex 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                : 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300'
            }`}>
              <strong className="font-bold block mb-1">{selectedAnswer === correctIndex ? 'Correct!' : 'Incorrect.'}</strong>
              {currentQuestion.explanation}
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={handleNext}
                className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-yellow-950 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                {currentQuestionIdx < quizData.length - 1 ? 'Next Question' : 'View Results'}
                <ChevronRight size={18} className="ml-1.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
