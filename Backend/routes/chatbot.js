import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 27. Chatbot Query Route (All Authenticated Users)
router.post('/query', authenticateToken, async (req, res) => {
  const { query, history } = req.body;
  const { role, name } = req.user;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  const systemMessage = {
    role: "system",
    content: `You are an AI learning assistant for the Generation Rise platform. You are talking to a user named ${name} who is a ${role}. You should explain concepts clearly, answer lesson-related questions, summarize lessons, generate practice questions, and suggest resources. Always maintain the conversation context and correctly render Markdown. Keep answers concise, friendly, and structured.`
  };

  const messages = [systemMessage];
  if (history && history.length > 0) {
    history.forEach(msg => {
      messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    });
  } else {
    messages.push({ role: "user", content: query });
  }

  try {
    // Use process.env for Groq keys to prevent secret leaks on GitHub
    const keys = [];
    if (process.env.GROQ_API_KEY_1) keys.push(process.env.GROQ_API_KEY_1);
    if (process.env.GROQ_API_KEY_2) keys.push(process.env.GROQ_API_KEY_2);
    if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
    
    const groqApiKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : process.env.GROQ_API_KEY;
    
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    
    const data = await groqResponse.json();
    if (!groqResponse.ok) {
      console.error('Groq API Error:', data);
      return res.status(500).json({ error: 'Failed to fetch AI response' });
    }
    
    const botResponse = data.choices[0].message.content;
    const suggestions = ['Explain a complex topic', 'Give me practice questions', 'Summarize my lessons'];
    
    res.json({ response: botResponse, suggestions });
  } catch (err) {
    console.error('Chatbot API error:', err);
    res.status(500).json({ error: 'Failed to process AI query' });
  }
});

export default router;
