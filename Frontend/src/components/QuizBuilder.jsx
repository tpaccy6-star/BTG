import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuizBuilder({ quizData, setQuizData }) {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');

  // Parse initial quizData string
  useEffect(() => {
    try {
      if (quizData && quizData.trim() !== '') {
        const parsed = JSON.parse(quizData);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          setQuestions(parsed.questions);
          setError('');
        } else {
          // If structure is not exactly { questions: [...] } but still JSON, wrap it
          setQuestions([]);
        }
      } else {
        setQuestions([]);
        setError('');
      }
    } catch (e) {
      setError('Existing quiz data is not valid JSON. Starting fresh or please fix raw data.');
    }
  }, [quizData]); // Only re-parse if raw data changes externally, though we manage it mostly here.
  
  // Sync outwards
  const updateExternal = (newQuestions) => {
    setQuestions(newQuestions);
    setQuizData(JSON.stringify({ questions: newQuestions }, null, 2));
  };

  const addQuestion = (type) => {
    const newQ = type === 'multiple-choice' 
      ? { type: 'multiple-choice', question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' }
      : { type: 'true-false', question: '', options: ['True', 'False'], correctAnswerIndex: 0, explanation: '' };
    updateExternal([...questions, newQ]);
  };

  const removeQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    updateExternal(updated);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    updateExternal(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    updateExternal(updated);
  };

  const setCorrectAnswer = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].correctAnswerIndex = oIndex;
    updateExternal(updated);
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-xl border border-red-200">{error}</div>}
      
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 relative group transition-all hover:border-blue-300 dark:hover:border-blue-900/50">
          
          <button 
            type="button"
            onClick={() => removeQuestion(qIndex)}
            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
            title="Remove Question"
          >
            <Trash2 size={16} />
          </button>

          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-400 font-black rounded-lg flex items-center justify-center text-[10px]">
              {qIndex + 1}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{q.type === 'multiple-choice' ? 'Multiple Choice' : 'True/False'}</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Question Text</label>
            <input 
              type="text" 
              value={q.question} 
              onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
              placeholder="e.g. What is the main purpose of..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:border-blue-500 text-slate-800 dark:text-white transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Options (Select the correct one)</label>
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className={`flex items-center space-x-3 p-2 rounded-xl border transition-all ${q.correctAnswerIndex === oIndex ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'}`}>
                <button 
                  type="button" 
                  onClick={() => setCorrectAnswer(qIndex, oIndex)}
                  className="shrink-0"
                >
                  {q.correctAnswerIndex === oIndex ? <CheckCircle2 size={18} className="text-blue-600" /> : <Circle size={18} className="text-slate-300" />}
                </button>
                <input 
                  type="text" 
                  value={opt} 
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                  disabled={q.type === 'true-false'}
                  placeholder={`Option ${oIndex + 1}`}
                  className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-slate-700 dark:text-slate-300 placeholder:text-slate-400 disabled:opacity-80"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Explanation (Shown after answering)</label>
            <textarea 
              value={q.explanation} 
              onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
              placeholder="Explain why this is the correct answer..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:border-blue-500 text-slate-800 dark:text-white min-h-[60px]"
            />
          </div>

        </div>
      ))}

      <div className="flex space-x-3 pt-2">
        <button 
          type="button" 
          onClick={() => addQuestion('multiple-choice')}
          className="flex-1 flex items-center justify-center py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-slate-700 border-dashed"
        >
          <Plus size={14} className="mr-1.5" /> Add Multiple Choice
        </button>
        <button 
          type="button" 
          onClick={() => addQuestion('true-false')}
          className="flex-1 flex items-center justify-center py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-slate-700 border-dashed"
        >
          <Plus size={14} className="mr-1.5" /> Add True/False
        </button>
      </div>

    </div>
  );
}
