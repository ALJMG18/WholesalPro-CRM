import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Property } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DealAnalysis {
  score: number;
  summary: string;
  pros: string[];
  cons: string[];
  strategy: string;
  estimatedProfit: string;
}

export const analyzeDeal = async (lead: Lead, property?: Property): Promise<DealAnalysis> => {
  const prompt = `
    Analyze this real estate wholesale deal based on the following information:
    
    LEAD INFO:
    - Name: ${lead.fullName}
    - Status: ${lead.status}
    - Source: ${lead.source}
    - Motivation: ${lead.propertyDetails?.motivation || 'Not specified'}
    - Occupancy: ${lead.propertyDetails?.occupancy || 'Unknown'}
    - Equity: ${lead.propertyDetails?.equity || 'Unknown'}
    - Notes: ${lead.notes || 'No additional notes'}
    
    PROPERTY INFO (if available):
    ${property ? `
    - Address: ${property.address}
    - ARV (After Repair Value): $${property.arv.toLocaleString()}
    - Asking Price: $${property.askingPrice.toLocaleString()}
    - Repair Estimate: $${property.repairEstimate.toLocaleString()}
    - MAO (Maximum Allowable Offer): $${property.mao.toLocaleString()}
    ` : 'No detailed property financial data provided yet.'}
    
    Provide a detailed wholesale analysis. 
    The score should be from 0 to 100, where 100 is a "slam dunk" deal.
    The estimated profit should be a realistic range for a wholesale fee.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Deal score from 0-100" },
          summary: { type: Type.STRING, description: "A brief 2-sentence summary of the deal" },
          pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of positive factors" },
          cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of negative factors or risks" },
          strategy: { type: Type.STRING, description: "Recommended wholesale strategy (e.g., Assignment, Double Close)" },
          estimatedProfit: { type: Type.STRING, description: "Estimated wholesale fee range" }
        },
        required: ["score", "summary", "pros", "cons", "strategy", "estimatedProfit"]
      }
    }
  });

  return JSON.parse(response.text);
};
