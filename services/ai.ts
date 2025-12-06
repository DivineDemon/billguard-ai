import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, BillIssue, DisputeGuide, UserInsuranceInput } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    hospitalName: { type: Type.STRING, description: "Name of the hospital or medical facility." },
    dateOfService: { type: Type.STRING, description: "Date of the medical service (YYYY-MM-DD)." },
    currency: { type: Type.STRING, description: "Currency code detected (e.g., PKR, USD, GBP)." },
    locale: { type: Type.STRING, description: "Inferred country/locale based on address/currency (e.g., Pakistan, USA)." },
    totalAmount: { type: Type.NUMBER, description: "Total billed amount found on the document." },
    insurance: {
      type: Type.OBJECT,
      properties: {
        detectedProvider: { type: Type.STRING, description: "Name of insurance provider if found (e.g., State Life, Jubilee, Sehat Sahulat)." },
        policyNumber: { type: Type.STRING, description: "Policy or Card number if visible." },
        claimedAmount: { type: Type.NUMBER, description: "Amount sent to insurance." },
        coveredAmount: { type: Type.NUMBER, description: "Amount paid by insurance." },
        patientResponsibility: { type: Type.NUMBER, description: "Amount the patient has to pay." },
        status: { type: Type.STRING, enum: ['Not Found', 'Pending', 'Applied', 'Rejected', 'Not Covered'] }
      }
    },
    confidenceScore: { type: Type.NUMBER, description: "Confidence score between 0 and 1 regarding extraction." },
    summary: { type: Type.STRING, description: "A brief 2-sentence summary of the bill content." },
    verificationMethodology: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of steps or sources used to verify the charges (e.g. 'Checked against CPT code 99213', 'Verified Sehat Sahulat coverage limits')."
    },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short title of the billing issue." },
          description: { type: Type.STRING, description: "Explanation of why this might be an error." },
          estimatedOvercharge: { type: Type.NUMBER, description: "Estimated amount of the overcharge in the detected currency." },
          category: { type: Type.STRING, enum: ['Duplicate', 'Upcoding', 'Unbundling', 'Inflation', 'Insurance Error', 'Other'] },
          severity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
        },
        required: ["title", "description", "estimatedOvercharge", "category", "severity"]
      }
    }
  },
  required: ["hospitalName", "totalAmount", "issues", "summary", "currency", "insurance", "verificationMethodology"]
};

export const BillAnalysisService = {
  /**
   * Analyzes a hospital bill image using Gemini 2.5 Flash.
   */
  analyzeBill: async (base64Image: string, userInsurance?: UserInsuranceInput): Promise<AnalysisResult> => {
    try {
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

      let insuranceContext = "The user has NOT indicated they have health insurance. Assume self-pay.";
      if (userInsurance?.hasInsurance) {
        insuranceContext = `The user states they have insurance with Provider: "${userInsurance.provider}" and Plan: "${userInsurance.planName}". 
        CRITICAL: Use this information to check if the bill correctly reflects insurance coverage. 
        If the bill shows 100% patient responsibility, this is likely an error (Balance Billing or Claim Not Filed).`;
      }

      const prompt = `Analyze this hospital bill image as an expert medical bill auditor.
              
      CONTEXT: This application is primarily for Pakistan. 
      ${insuranceContext}

      TASK:
      1. Extract facility details, total amounts, and currency.
      2. DETECT INSURANCE ON BILL: Check if the bill acknowledges the user's insurance.
      3. VERIFY CHARGES: 
          - Identify Duplicate charges.
          - Identify Upcoding or Unbundling.
          - Identify "Inflation" by comparing against standard market rates in Pakistan (or the bill's region).
      4. EXPLAIN METHODOLOGY: Explicitly list the logic used to verify prices (e.g. "Checked standard price for MRI in Lahore", "Verified CPT code bundling rules").
      
      OUTPUT: JSON matching the schema provided.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64
              }
            },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA,
          temperature: 0.2,
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
   * Generates a dispute letter and guide using Gemini 3 Pro.
   */
  generateDisputeGuide: async (bill: AnalysisResult): Promise<DisputeGuide> => {
    try {
      const prompt = `
        You are a patient advocate helping a user dispute a hospital bill in ${bill.locale || 'Pakistan'}.
        
        Hospital: ${bill.hospitalName}
        Currency: ${bill.currency}
        Total: ${bill.totalAmount}
        Insurance Status on Bill: ${bill.insurance.status}
        Insurance Provider (User Reported): ${bill.insurance.detectedProvider || 'Not specified'}
        
        Identified Issues:
        ${JSON.stringify(bill.issues, null, 2)}
        
        Task 1: Write a formal dispute letter. 
        - Address it to the Hospital Billing Dept and/or Insurance Provider.
        - Cite the specific errors found.
        - Use formal language appropriate for the region.
        
        Task 2: Provide 3-5 concrete next steps.
        - Mention specific Pakistani regulatory bodies if applicable (e.g. PMDC, Insurance Ombudsman).

        Return JSON with "letter" and "steps".
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
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
