import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, BillIssue, DisputeGuide } from "../types";

// Initialize the client
// Note: In a real production app, this should be proxied through a backend to protect the API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    hospitalName: { type: Type.STRING, description: "Name of the hospital or medical facility." },
    dateOfService: { type: Type.STRING, description: "Date of the medical service (YYYY-MM-DD)." },
    totalAmount: { type: Type.NUMBER, description: "Total billed amount found on the document." },
    confidenceScore: { type: Type.NUMBER, description: "Confidence score between 0 and 1 regarding the legibility and accuracy of extraction." },
    summary: { type: Type.STRING, description: "A brief 2-sentence summary of the bill." },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short title of the billing issue (e.g. 'Duplicate Charge')." },
          description: { type: Type.STRING, description: "Explanation of why this might be an error." },
          estimatedOvercharge: { type: Type.NUMBER, description: "Estimated dollar amount of the overcharge." },
          category: { type: Type.STRING, enum: ['Duplicate', 'Upcoding', 'Unbundling', 'Inflation', 'Other'] },
          severity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
        },
        required: ["title", "description", "estimatedOvercharge", "category", "severity"]
      }
    }
  },
  required: ["hospitalName", "totalAmount", "issues", "summary"]
};

export const BillAnalysisService = {
  /**
   * Analyzes a hospital bill image using Gemini 2.5 Flash.
   */
  analyzeBill: async (base64Image: string): Promise<AnalysisResult> => {
    try {
      // Remove header if present to get pure base64
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png', // Assuming PNG/JPEG, API handles standard image types well
                data: cleanBase64
              }
            },
            {
              text: `Analyze this hospital bill image as an expert medical bill auditor. 
              Extract the facility details and total. 
              Crucially, identify potential billing errors such as:
              1. Duplicate charges (same item listed twice).
              2. Upcoding (coding for a more severe condition than supported).
              3. Unbundling (charging separately for items that should be a package).
              4. "Inflation" or excessive pricing compared to standard Medicare rates (estimate if possible).
              
              Be conservative but helpful. If the bill looks clean, return an empty issues list.`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA,
          temperature: 0.2, // Low temperature for factual extraction
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      return JSON.parse(text) as AnalysisResult;
    } catch (error) {
      console.error("Analysis failed:", error);
      throw error;
    }
  },

  /**
   * Generates a dispute letter and guide using Gemini 3 Pro (for better reasoning/writing).
   */
  generateDisputeGuide: async (bill: AnalysisResult): Promise<DisputeGuide> => {
    try {
      const prompt = `
        You are a patient advocate helping a user dispute a hospital bill.
        
        Hospital: ${bill.hospitalName}
        Date: ${bill.dateOfService}
        Total: $${bill.totalAmount}
        
        Identified Issues:
        ${JSON.stringify(bill.issues, null, 2)}
        
        Task 1: Write a formal, professional dispute letter addressed to the billing department. 
        The letter should request an itemized statement (if not present), a coding review, and specifically challenge the identified issues.
        Use placeholders like [Your Name], [Account Number] for missing info.
        
        Task 2: Provide a list of 3-5 concrete next steps the user should take (e.g. "Check CPT codes", "Contact insurance").

        Return the response as a JSON object with keys: "letter" (string) and "steps" (string array).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Using Pro for better writing capability
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              letter: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      return JSON.parse(text) as DisputeGuide;

    } catch (error) {
      console.error("Dispute generation failed:", error);
      throw error;
    }
  }
};
