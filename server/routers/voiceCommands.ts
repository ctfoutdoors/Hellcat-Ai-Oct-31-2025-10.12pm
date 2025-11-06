import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import {
  parseVoiceCommand,
  getAvailableCommands,
  getCommandsByCategory,
  getCommandById,
  searchCommands,
  validateCommandParameters,
} from '../services/voiceCommands';

export const voiceCommandsRouter = router({
  
  /**
   * Parse voice input and return matched command
   */
  parse: protectedProcedure
    .input(z.object({
      voiceInput: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await parseVoiceCommand(input.voiceInput);
      
      if (!result.command) {
        return {
          success: false,
          message: 'Could not understand command',
          confidence: result.confidence,
        };
      }

      // Validate parameters
      const validation = validateCommandParameters(result.command, result.parameters);
      
      if (!validation.valid) {
        return {
          success: false,
          message: `Missing required parameters: ${validation.missing.join(', ')}`,
          command: result.command,
          parameters: result.parameters,
          confidence: result.confidence,
        };
      }

      return {
        success: true,
        command: result.command,
        parameters: result.parameters,
        confidence: result.confidence,
      };
    }),

  /**
   * Get all available voice commands
   */
  list: protectedProcedure
    .query(() => {
      return {
        commands: getAvailableCommands(),
        total: getAvailableCommands().length,
      };
    }),

  /**
   * Get commands grouped by category
   */
  listByCategory: protectedProcedure
    .query(() => {
      return {
        categories: getCommandsByCategory(),
      };
    }),

  /**
   * Search commands
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string(),
    }))
    .query(({ input }) => {
      return {
        commands: searchCommands(input.query),
      };
    }),

  /**
   * Get command by ID
   */
  getById: protectedProcedure
    .input(z.object({
      commandId: z.string(),
    }))
    .query(({ input }) => {
      const command = getCommandById(input.commandId);
      
      if (!command) {
        throw new Error('Command not found');
      }

      return { command };
    }),
});
