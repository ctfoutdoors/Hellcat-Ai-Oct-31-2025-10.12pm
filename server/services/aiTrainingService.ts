import { getDb } from "../db";
import { sql } from "drizzle-orm";

interface CustomCommand {
  id: string;
  userId: number;
  userPhrase: string; // What user says
  intentedAction: string; // What action should be taken
  actionData?: any; // Additional data for the action
  examples: string[]; // Variations of the command
  createdAt: Date;
  usageCount: number;
}

interface CommandCorrection {
  id: string;
  userId: number;
  originalCommand: string;
  aiInterpretation: string;
  correctInterpretation: string;
  correctedAt: Date;
}

export class AITrainingService {
  /**
   * Teach the AI a new custom command
   */
  static async teachCommand(
    userId: number,
    userPhrase: string,
    intendedAction: string,
    actionData?: any,
    examples: string[] = []
  ): Promise<CustomCommand> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const command: CustomCommand = {
      id: commandId,
      userId,
      userPhrase,
      intentedAction: intendedAction,
      actionData,
      examples,
      createdAt: new Date(),
      usageCount: 0,
    };

    // Store in a custom_commands table (would need to add to schema)
    // For now, store in user preferences as JSON
    const prefs = await this.getUserTrainingData(userId);
    prefs.customCommands = prefs.customCommands || [];
    prefs.customCommands.push(command);

    await this.saveUserTrainingData(userId, prefs);

    return command;
  }

  /**
   * Correct a misunderstood command
   */
  static async correctCommand(
    userId: number,
    originalCommand: string,
    aiInterpretation: string,
    correctInterpretation: string
  ): Promise<CommandCorrection> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const correctionId = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const correction: CommandCorrection = {
      id: correctionId,
      userId,
      originalCommand,
      aiInterpretation,
      correctInterpretation,
      correctedAt: new Date(),
    };

    // Store correction
    const prefs = await this.getUserTrainingData(userId);
    prefs.commandCorrections = prefs.commandCorrections || [];
    prefs.commandCorrections.push(correction);

    // Also create a custom command from this correction
    await this.teachCommand(
      userId,
      originalCommand,
      correctInterpretation,
      undefined,
      [originalCommand]
    );

    await this.saveUserTrainingData(userId, prefs);

    return correction;
  }

  /**
   * Get all custom commands for a user
   */
  static async getCustomCommands(userId: number): Promise<CustomCommand[]> {
    const prefs = await this.getUserTrainingData(userId);
    return prefs.customCommands || [];
  }

  /**
   * Get all command corrections for a user
   */
  static async getCommandCorrections(
    userId: number
  ): Promise<CommandCorrection[]> {
    const prefs = await this.getUserTrainingData(userId);
    return prefs.commandCorrections || [];
  }

  /**
   * Match user input against custom commands
   */
  static async matchCustomCommand(
    userId: number,
    userInput: string
  ): Promise<CustomCommand | null> {
    const commands = await this.getCustomCommands(userId);
    const inputLower = userInput.toLowerCase().trim();

    // Exact match first
    for (const cmd of commands) {
      if (cmd.userPhrase.toLowerCase().trim() === inputLower) {
        cmd.usageCount++;
        await this.incrementCommandUsage(userId, cmd.id);
        return cmd;
      }
    }

    // Check examples
    for (const cmd of commands) {
      for (const example of cmd.examples) {
        if (example.toLowerCase().trim() === inputLower) {
          cmd.usageCount++;
          await this.incrementCommandUsage(userId, cmd.id);
          return cmd;
        }
      }
    }

    // Fuzzy match (contains)
    for (const cmd of commands) {
      if (inputLower.includes(cmd.userPhrase.toLowerCase())) {
        cmd.usageCount++;
        await this.incrementCommandUsage(userId, cmd.id);
        return cmd;
      }
    }

    return null;
  }

  /**
   * Delete a custom command
   */
  static async deleteCustomCommand(
    userId: number,
    commandId: string
  ): Promise<void> {
    const prefs = await this.getUserTrainingData(userId);
    prefs.customCommands = (prefs.customCommands || []).filter(
      (cmd) => cmd.id !== commandId
    );
    await this.saveUserTrainingData(userId, prefs);
  }

  /**
   * Update a custom command
   */
  static async updateCustomCommand(
    userId: number,
    commandId: string,
    updates: Partial<CustomCommand>
  ): Promise<CustomCommand | null> {
    const prefs = await this.getUserTrainingData(userId);
    const commands = prefs.customCommands || [];
    const index = commands.findIndex((cmd) => cmd.id === commandId);

    if (index === -1) return null;

    commands[index] = { ...commands[index], ...updates };
    await this.saveUserTrainingData(userId, prefs);

    return commands[index];
  }

  /**
   * Export custom commands as JSON
   */
  static async exportCustomCommands(userId: number): Promise<string> {
    const commands = await this.getCustomCommands(userId);
    return JSON.stringify(commands, null, 2);
  }

  /**
   * Import custom commands from JSON
   */
  static async importCustomCommands(
    userId: number,
    jsonData: string
  ): Promise<number> {
    try {
      const commands = JSON.parse(jsonData) as CustomCommand[];
      const prefs = await this.getUserTrainingData(userId);

      // Add imported commands (avoiding duplicates)
      const existingPhrases = new Set(
        (prefs.customCommands || []).map((cmd) => cmd.userPhrase.toLowerCase())
      );

      let importedCount = 0;
      for (const cmd of commands) {
        if (!existingPhrases.has(cmd.userPhrase.toLowerCase())) {
          prefs.customCommands = prefs.customCommands || [];
          prefs.customCommands.push({
            ...cmd,
            id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            createdAt: new Date(),
          });
          importedCount++;
        }
      }

      await this.saveUserTrainingData(userId, prefs);
      return importedCount;
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  }

  /**
   * Get training statistics
   */
  static async getTrainingStats(userId: number): Promise<{
    totalCustomCommands: number;
    totalCorrections: number;
    mostUsedCommand: CustomCommand | null;
    recentCorrections: CommandCorrection[];
  }> {
    const commands = await this.getCustomCommands(userId);
    const corrections = await this.getCommandCorrections(userId);

    const mostUsed = commands.reduce(
      (max, cmd) => (cmd.usageCount > (max?.usageCount || 0) ? cmd : max),
      null as CustomCommand | null
    );

    return {
      totalCustomCommands: commands.length,
      totalCorrections: corrections.length,
      mostUsedCommand: mostUsed,
      recentCorrections: corrections.slice(-5),
    };
  }

  /**
   * Helper: Get user training data from preferences
   */
  private static async getUserTrainingData(userId: number): Promise<any> {
    const db = await getDb();
    if (!db) return {};

    try {
      const result = await db.execute(
        sql`SELECT training_data FROM aiChatbotPreferences WHERE userId = ${userId} LIMIT 1`
      );

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0] as any;
        return row.training_data ? JSON.parse(row.training_data as string) : {};
      }

      return {};
    } catch (error) {
      console.error("Error getting training data:", error);
      return {};
    }
  }

  /**
   * Helper: Save user training data to preferences
   */
  private static async saveUserTrainingData(
    userId: number,
    data: any
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const jsonData = JSON.stringify(data);

      await db.execute(
        sql`INSERT INTO aiChatbotPreferences (userId, training_data, updatedAt)
            VALUES (${userId}, ${jsonData}, NOW())
            ON DUPLICATE KEY UPDATE training_data = ${jsonData}, updatedAt = NOW()`
      );
    } catch (error) {
      console.error("Error saving training data:", error);
    }
  }

  /**
   * Helper: Increment command usage count
   */
  private static async incrementCommandUsage(
    userId: number,
    commandId: string
  ): Promise<void> {
    const prefs = await this.getUserTrainingData(userId);
    const commands = prefs.customCommands || [];
    const cmd = commands.find((c: CustomCommand) => c.id === commandId);

    if (cmd) {
      cmd.usageCount = (cmd.usageCount || 0) + 1;
      await this.saveUserTrainingData(userId, prefs);
    }
  }
}
