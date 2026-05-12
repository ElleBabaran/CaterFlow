import { useState, useCallback } from 'react';
import { Message } from '../types';
import { QUESTIONS, getQuestionText, detectFoodChoiceMode } from '../services/questions';
import { validateUserResponse, generateConversationalPrompt, predictWeather } from '../services/orchestrator';
import { hasCurrencyMarker } from '../services/budget';

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [eventData, setEventData] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatting, setIsChatting] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleChatSubmit = useCallback(async (input: string) => {
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    const currentQuestion = QUESTIONS[qIndex];
    
    // Add user message
    const userMsg: Message = { 
      id: `user-${Date.now()}`,
      role: 'user', 
      content: userText, 
      qKey: currentQuestion.key,
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);

    // Handle budget currency refinement
    let refinedAmount = userText;
    const currencyRegex = /[\$\£\€\¥\₱\₹]|(USD|PHP|EUR|GBP|AED|CAD|AUD|JPY|CNY|PESO|PESOS)/i;
    if (currentQuestion.key === 'budget' && eventData.budget && !hasCurrencyMarker(eventData.budget)) {
      if (currencyRegex.test(userText) || /^\w{3}$/.test(userText)) {
        refinedAmount = `${eventData.budget} ${userText}`;
      }
    }

    const newEventData = { ...eventData, [currentQuestion.key]: refinedAmount };

    // Weather check (Priority 3 fix: use newEventData)
    if (currentQuestion.key === 'event_date' && newEventData.event_location) {
      predictWeather(newEventData.event_location, userText).then(weather => {
        setMessages(prev => [...prev, {
          id: `bot-weather-${Date.now()}`,
          role: 'bot',
          content: `🌤️ **Weather Forecast for ${newEventData.event_location}:** ${weather.summary}\n\n${weather.recommendations[0]}`,
          timestamp: new Date()
        }]);
      });
    }

    // Currency prompt if missing
    if (currentQuestion.key === 'budget') {
      const hasCurrency = hasCurrencyMarker(refinedAmount);
      if (!hasCurrency && /^\d+$/.test(refinedAmount.replace(/[,. ]/g, ''))) {
        setMessages(prev => [...prev, { 
          id: `bot-currency-${Date.now()}`,
          role: 'bot', 
          content: "I've noted the amount! Just to be precise, which currency are you using? (e.g., $, ₱, USD, PHP, Pesos)", 
          timestamp: new Date() 
        }]);
        setEventData(newEventData);
        return;
      }
    }

    setEventData(newEventData);

    if (qIndex < QUESTIONS.length - 1) {
      setIsProcessing(true);

      const validation = await validateUserResponse(currentQuestion.text, userText, newEventData.preferred_language);
      if (!validation.valid) {
        setMessages(prev => [...prev, { 
          id: `bot-err-${Date.now()}`,
          role: 'bot', 
          content: validation.message || "Please provide a more specific answer.", 
          timestamp: new Date() 
        }]);
        setIsProcessing(false);
        return; 
      }

      let nextIdx = qIndex + 1;
      
      // Branching logic for food choice (Priority 3 fix: detectFoodChoiceMode)
      if (currentQuestion.key === 'food_choice_mode') {
        const mode = detectFoodChoiceMode(userText);
        newEventData.food_choice_mode = mode;
        
        if (mode === 'suggest') {
          const skipIdx = QUESTIONS.findIndex(q => q.key === 'specific_food_items');
          if (skipIdx !== -1 && nextIdx === skipIdx) nextIdx++;
        }
      }

      const nextQuestion = getQuestionText(nextIdx, newEventData.preferred_language);
      const conversationalReply = await generateConversationalPrompt(
        currentQuestion.key,
        currentQuestion.text,
        userText,
        nextQuestion,
        newEventData.preferred_language,
      );
      const botMessage = conversationalReply.reply || nextQuestion;

      setTimeout(() => {
        setQIndex(nextIdx);
        setMessages(prev => [...prev, {
          id: `bot-q-${Date.now()}`,
          role: 'bot', 
          content: botMessage, 
          timestamp: new Date() 
        }]);
        setIsProcessing(false);
      }, 800);
    } else {
      if (isConfirming || showSummary) {
        const updatedSpecial = `${newEventData.special_requests || ""}\nAdditional info: ${userText}`.trim();
        const finalEventData = { ...newEventData, special_requests: updatedSpecial };
        setEventData(finalEventData);
        setIsProcessing(true);
        setTimeout(() => {
          setIsConfirming(true);
          setShowSummary(true);
          setMessages(prev => [...prev, { 
            id: `sys-review-update-${Date.now()}`,
            role: 'bot', 
            content: "Got it! I've added that to your request. Here is the updated summary:", 
            timestamp: new Date() 
          }]);
          setIsProcessing(false);
        }, 800);
        return;
      }

      setIsConfirming(true);
      setShowSummary(true);
      setMessages(prev => [...prev, { 
        id: `sys-review-${Date.now()}`,
        role: 'bot', 
        content: "I've gathered all the details! Please review the summary below. Is everything correct, or would you like to add anything else?", 
        timestamp: new Date() 
      }]);
    }
  }, [qIndex, eventData, isProcessing, isConfirming, showSummary]);

  const restartChat = useCallback(() => {
    setMessages([{ 
      id: 'bot-start', 
      role: 'bot', 
      content: getQuestionText(0), 
      timestamp: new Date() 
    }]);
    setQIndex(0);
    setEventData({});
    setIsChatting(true);
    setShowSummary(false);
    setIsConfirming(false);
  }, []);

  return {
    messages, setMessages,
    qIndex, setQIndex,
    eventData, setEventData,
    isProcessing, setIsProcessing,
    isChatting, setIsChatting,
    showSummary, setShowSummary,
    isConfirming, setIsConfirming,
    handleChatSubmit,
    restartChat,
  };
}
