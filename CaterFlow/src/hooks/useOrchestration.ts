import { useState, useCallback } from 'react';
import { AgentStep } from '../types';
import { orchestrateCatering } from '../services/orchestrator';
import { mongoService } from '../services/mongodb';

export function useOrchestration() {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);

  const runOrchestration = useCallback(async (fullPrompt: string, eventData: any, user: any, activeConversationId: string | null) => {
    setIsProcessing(true);
    setSteps([]);
    setCurrentStepIndex(-1);

    try {
      const result = await orchestrateCatering(fullPrompt, (step) => {
        setSteps(prev => [...prev, step]);
        setCurrentStepIndex(prev => prev + 1);
      });

      if (result.success && user) {
        const eventRecord = {
          userId: user.uid,
          type: 'plan',
          rawInput: fullPrompt,
          eventData: eventData,
          steps: (result.data as any).steps || [], // Assuming result.data contains all steps
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        if (activeConversationId) {
          await mongoService.updateEvent(activeConversationId, eventRecord);
        } else {
          await mongoService.saveEvent(eventRecord);
        }
      }
      return result;
    } catch (error) {
      console.error("Orchestration error:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    steps,
    setSteps,
    currentStepIndex,
    setCurrentStepIndex,
    isProcessing,
    runOrchestration,
  };
}
