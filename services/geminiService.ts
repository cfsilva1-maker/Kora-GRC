
import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysisResult, Vendor } from "../types";

// Always use the process.env.API_KEY directly for initialization.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Risk Analysis ---

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    riskScore: { type: Type.NUMBER, description: "Score 0-100" },
    riskLevel: { type: Type.STRING },
    summary: { type: Type.STRING },
    keyRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
    mitigationStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
    isoComplianceGap: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of missing ISO 27036 controls" },
  },
  required: ["riskScore", "riskLevel", "summary", "keyRisks", "mitigationStrategies", "isoComplianceGap"],
};

export const analyzeVendorRisk = async (vendor: Vendor, additionalNotes: string): Promise<RiskAnalysisResult> => {
  try {
    // Extract ISO 27001 specific context
    const iso27001Evidence = vendor.evidences.find(e => e.type === 'ISO 27001');
    const ismsImplemented = vendor.securityProfile?.isms;

    const prompt = `
      Context: ISO 31000 Risk Management & ISO 27036 Supplier Relationships.
      Analyze this vendor based on the provided data.
      
      Vendor Name: ${vendor.name}
      Category: ${vendor.category}
      Services: ${vendor.services.map(s => `${s.name} (${s.criticality})`).join(', ')}
      Description: ${vendor.description}
      Current Lifecycle: ${vendor.lifecycleStage}
      
      Security Profile & Compliance:
      - ISO 27001 Evidence: ${iso27001Evidence ? `${iso27001Evidence.status} (Expires: ${iso27001Evidence.expiryDate})` : 'Not Provided'}
      - ISMS Implemented: ${ismsImplemented ? 'Yes' : 'No'}
      - Data Location: ${vendor.securityProfile?.dataLocation || 'Unknown'}
      - Encryption: ${vendor.securityProfile?.encryption || 'Unknown'}
      
      User Notes: ${additionalNotes}
      
      Task:
      1. Assess Inherent Risk based on service criticality and data access.
      2. Identify potential gaps in ISO 27036 compliance. Specifically check if ISO 27001 certification is valid and consistent with the ISMS status. If the certificate is missing or expired for a Critical/Strategic vendor, flag this as a major gap.
      3. Suggest mitigation strategies for the 'Treatment & Contracting' phase.
    `;

    // Use gemini-3-pro-preview for complex reasoning tasks like risk analysis
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as RiskAnalysisResult;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const generateQuestionnaire = async (category: string): Promise<string[]> => {
    try {
        // Use gemini-3-flash-preview for general text generation tasks
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate 5 specific ISO 27036 due diligence questions for a '${category}' vendor to assess information security capability. Return a JSON Array of strings.`,
             config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
             }
        });
        return response.text ? JSON.parse(response.text) : [];
    } catch (e) {
        return ["Failed to generate questions."];
    }
}

// --- Evidence Validation (ISO 27001 / SOC 2) ---

export const validateEvidenceAI = async (evidenceName: string, extractedTextSnippet: string): Promise<{isValid: boolean, notes: string, confidence: number, extractedExpiry?: string}> => {
  const prompt = `
    Act as a Third-Party Risk Officer. Validate this document snippet.
    Document Type: ${evidenceName}
    Snippet: "${extractedTextSnippet}"
    
    Checks:
    1. Is it a valid certificate/report?
    2. Is there an expiry date?
    3. Does it match standard ISO/SOC formats?

    Return JSON: { "isValid": boolean, "notes": string, "confidence": number (0-100), "extractedExpiry": string (YYYY-MM-DD or null) }
  `;

  try {
     const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: { type: Type.BOOLEAN },
              notes: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              extractedExpiry: { type: Type.STRING }
            },
            required: ["isValid", "notes", "confidence"]
          }
        }
     });
     return JSON.parse(response.text || '{}');
  } catch (e) {
      return { isValid: false, notes: "AI Validation Failed", confidence: 0 };
  }
}

// --- Contract Clause Analysis (ISO 27036-4) ---

export const analyzeContractClausesAI = async (contractTextSnippet: string): Promise<any> => {
    const prompt = `
      Analyze this contract excerpt against ISO 27036-4 (Supplier Relationship) requirements. 
      
      Look for these specific clauses:
      1. Confidentiality & NDA
      2. Right to Audit / Inspection
      3. Data Breach Notification (Timeframe?)
      4. Sub-processor Liability (Flow down clauses)
      5. Disaster Recovery / Business Continuity
      6. Termination & Data Return (Offboarding)
      
      Excerpt: "${contractTextSnippet}"
      
      Return JSON:
      {
        "summary": "Short analysis summary",
        "missingClauses": ["List of missing critical clauses"],
        "riskFlags": ["List of ambiguous or risky terms"],
        "foundClauses": {
            "confidentiality": boolean,
            "rightToAudit": boolean,
            "dataBreachNotification": boolean,
            "subprocessorLiability": boolean,
            "disasterRecovery": boolean
        }
      }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  missingClauses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  riskFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  foundClauses: {
                    type: Type.OBJECT,
                    properties: {
                      confidentiality: { type: Type.BOOLEAN },
                      rightToAudit: { type: Type.BOOLEAN },
                      dataBreachNotification: { type: Type.BOOLEAN },
                      subprocessorLiability: { type: Type.BOOLEAN },
                      disasterRecovery: { type: Type.BOOLEAN }
                    },
                    required: ["confidentiality", "rightToAudit", "dataBreachNotification", "subprocessorLiability", "disasterRecovery"]
                  }
                },
                required: ["summary", "missingClauses", "riskFlags", "foundClauses"]
              }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch(e) {
        return null;
    }
}

// --- General Contract Summarization (New Feature) ---

export const generateContractSummary = async (fileName: string, contractType: string): Promise<string> => {
    const prompt = `
        You are a Legal AI Assistant.
        Generate a professional executive summary for a legal contract.
        
        Contract File Name: "${fileName}"
        Contract Type: "${contractType}"
        
        Since I cannot read the full file in this demo environment, please generate a *realistic simulated summary* that one would expect to see for a contract of this type (e.g., standard terms for an MSA or DPA).
        Include key aspects like term duration, liability caps, and jurisdiction.
        Keep it under 80 words.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        return response.text || "Summary generation failed.";
    } catch (e) {
        return "Failed to generate summary.";
    }
}


// --- Questionnaire Question Refinement ---

export interface QuestionAnalysisResult {
    refinedText: string;
    suggestedWeight: number;
    reasoning: string;
}

export const analyzeQuestionAI = async (questionText: string, currentWeight: number): Promise<QuestionAnalysisResult | null> => {
    const prompt = `
        As a TPRM Subject Matter Expert, analyze the following Due Diligence Question.
        
        Original Question: "${questionText}"
        Current Weight (1-10): ${currentWeight}
        
        Goal: 
        1. Improve clarity and precision (adhering to SIG/ISO standards).
        2. Suggest an appropriate weight based on risk impact (1=Low, 10=Critical).
        
        Return JSON:
        {
            "refinedText": "The improved question text",
            "suggestedWeight": number,
            "reasoning": "Why this change is recommended"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  refinedText: { type: Type.STRING },
                  suggestedWeight: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING }
                },
                required: ["refinedText", "suggestedWeight", "reasoning"]
              }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("AI Question Analysis failed", e);
        return null;
    }
}

// --- Action Plan Generation ---

export interface AIActionPlan {
    description: string;
    suggestedCorrection: string;
    implementationSteps: string;
}

export const generateActionPlanAI = async (
    issueSummary: string, 
    vendorName: string, 
    riskType: string
): Promise<AIActionPlan | null> => {
    const prompt = `
        You are an expert Risk Manager. Create a comprehensive Remediation Action Plan based on the following context.

        Context:
        - Issue/Incident: "${issueSummary}"
        - Vendor: "${vendorName}"
        - Risk Category: "${riskType}"

        Output Requirements:
        1. Description: A concise, professional title for the remediation action.
        2. Suggested Correction: What specifically needs to be fixed or changed?
        3. Steps to Implement: A step-by-step guide for the vendor to execute the fix.

        Return JSON:
        {
            "description": "Action Plan Title",
            "suggestedCorrection": "Technical explanation of the fix...",
            "implementationSteps": "1. Step one\n2. Step two..."
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  suggestedCorrection: { type: Type.STRING },
                  implementationSteps: { type: Type.STRING }
                },
                required: ["description", "suggestedCorrection", "implementationSteps"]
              }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("AI Action Plan generation failed", e);
        return null;
    }
}
