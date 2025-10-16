// Import the Genkit core libraries and plugins.
import {genkit, z} from "genkit";
import {googleAI} from "@genkit-ai/googleai";

// Import models from the Google AI plugin. The Google AI API provides access to
// several generative models. Here, we import Gemini 2.0 Flash.
import {gemini20Flash} from "@genkit-ai/googleai";

// Cloud Functions for Firebase supports Genkit natively. The onCallGenkit function creates a callable
// function from a Genkit action. It automatically implements streaming if your flow does.
// The https library also has other utility methods such as hasClaim, which verifies that
// a caller's token has a specific claim (optionally matching a specific value)
import { onCallGenkit, hasClaim } from "firebase-functions/https";

// Genkit models generally depend on an API key. APIs should be stored in Cloud Secret Manager so that
// access to these sensitive values can be controlled. defineSecret does this for you automatically.
// If you are using Google generative AI you can get an API key at https://aistudio.google.com/app/apikey
import { defineSecret } from "firebase-functions/params";
const apiKey = defineSecret("GOOGLE_GENAI_API_KEY");

// The Firebase telemetry plugin exports a combination of metrics, traces, and logs to Google Cloud
// Observability. See https://firebase.google.com/docs/genkit/observability/telemetry-collection.
import {enableFirebaseTelemetry} from "@genkit-ai/firebase";
enableFirebaseTelemetry();

const ai = genkit({
  plugins: [
    // Load the Google AI plugin. You can optionally specify your API key
    // by passing in a config object; if you don't, the Google AI plugin uses
    // the value from the GOOGLE_GENAI_API_KEY environment variable, which is
    // the recommended practice.
    googleAI(),
  ],
});

// Define a simple flow that prompts an LLM to generate menu suggestions.
const menuSuggestionFlow = ai.defineFlow({
    name: "menuSuggestionFlow",
    inputSchema: z.string().describe("A restaurant theme").default("seafood"),
    outputSchema: z.string(),
    streamSchema: z.string(),
  }, async (subject, { sendChunk }) => {
    // Construct a request and send it to the model API.
    const prompt =
      `Suggest an item for the menu of a ${subject} themed restaurant`;
    const { response, stream } = ai.generateStream({
      model: gemini20Flash,
      prompt: prompt,
      config: {
        temperature: 1,
      },
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    // Handle the response from the model API. In this sample, we just
    // convert it to a string, but more complicated flows might coerce the
    // response into structured output or chain the response into another
    // LLM call, etc.
    return (await response).text;
  }
);

export const menuSuggestion = onCallGenkit({
  // Uncomment to enable AppCheck. This can reduce costs by ensuring only your Verified
  // app users can use your API. Read more at https://firebase.google.com/docs/app-check/cloud-functions
  // enforceAppCheck: true,

  // authPolicy can be any callback that accepts an AuthData (a uid and tokens dictionary) and the
  // request data. The isSignedIn() and hasClaim() helpers can be used to simplify. The following
  // will require the user to have the email_verified claim, for example.
  // authPolicy: hasClaim("email_verified"),

  // Grant access to the API key to this function:
  secrets: [apiKey],
}, menuSuggestionFlow);


// Flow for summarizing notes
export const summarizeNotesFlow = ai.defineFlow(
  {
    name: "summarizeNotesFlow",
    inputSchema: z.string().describe("The notes to be summarized"),
    outputSchema: z.string(),
  },
  async (notes) => {
    const { response } = await ai.generate({
      model: gemini20Flash,
      prompt: `Summarize the following notes for a student, highlighting the key concepts: ${notes}`,
      config: { temperature: 0.5 },
    });
    return response.text;
  }
);

export const summarizeNotes = onCallGenkit({ secrets: [apiKey] }, summarizeNotesFlow);


// Flow for generating flashcards
const flashcardSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const generateFlashcardsFlow = ai.defineFlow(
  {
    name: "generateFlashcardsFlow",
    inputSchema: z.string().describe("The notes to generate flashcards from"),
    outputSchema: z.array(flashcardSchema),
  },
  async (notes) => {
    const { response } = await ai.generate({
      model: gemini20Flash,
      prompt: `Generate 5 flashcards from the following notes. Each flashcard should have a 'question' and an 'answer'. Return the output as a valid JSON array of objects: ${notes}`,
      config: { temperature: 0.7 },
      responseFormat: "json",
    });
    return response.json();
  }
);

export const generateFlashcards = onCallGenkit({ secrets: [apiKey] }, generateFlashcardsFlow);


// Flow for generating a quiz
const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answer: z.string(),
});

export const generateQuizFlow = ai.defineFlow(
  {
    name: "generateQuizFlow",
    inputSchema: z.string().describe("The notes to generate a quiz from"),
    outputSchema: z.array(quizQuestionSchema),
  },
  async (notes) => {
    const { response } = await ai.generate({
      model: gemini20Flash,
      prompt: `Generate a 5-question multiple-choice quiz from the following notes. Each question should have a 'question', an array of 4 'options', and an 'answer'. Ensure one of the options is the correct answer. Return the output as a valid JSON array of objects: ${notes}`,
      config: { temperature: 0.7 },
      responseFormat: "json",
    });
    return response.json();
  }
);

export const generateQuiz = onCallGenkit({ secrets: [apiKey] }, generateQuizFlow);
