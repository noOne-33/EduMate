'use server';
/**
 * @fileOverview AI-powered personalized course recommendations flow.
 *
 * - personalizedCourseRecommendations - A function that returns personalized course recommendations based on user history.
 * - PersonalizedCourseRecommendationsInput - The input type for the personalizedCourseRecommendations function.
 * - PersonalizedCourseRecommendationsOutput - The return type for the personalizedCourseRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedCourseRecommendationsInputSchema = z.object({
  userHistory: z.string().describe('The user browsing history and enrolled courses.'),
});

export type PersonalizedCourseRecommendationsInput = z.infer<
  typeof PersonalizedCourseRecommendationsInputSchema
>;

const PersonalizedCourseRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('A list of personalized course recommendations.'),
});

export type PersonalizedCourseRecommendationsOutput = z.infer<
  typeof PersonalizedCourseRecommendationsOutputSchema
>;

export async function personalizedCourseRecommendations(
  input: PersonalizedCourseRecommendationsInput
): Promise<PersonalizedCourseRecommendationsOutput> {
  return personalizedCourseRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedCourseRecommendationsPrompt',
  input: {schema: PersonalizedCourseRecommendationsInputSchema},
  output: {schema: PersonalizedCourseRecommendationsOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an AI assistant designed to provide personalized course recommendations based on a user's learning history.

  Analyze the user's past browsing history and enrolled courses to understand their interests and learning goals.

  Based on this information, recommend courses that align with their preferences and could expand their knowledge.

  User History: {{{userHistory}}}

  Provide a list of course recommendations that would be relevant and interesting to the user.`,
});

const personalizedCourseRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedCourseRecommendationsFlow',
    inputSchema: PersonalizedCourseRecommendationsInputSchema,
    outputSchema: PersonalizedCourseRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
