export enum BillStatus {
  ANALYZING = "Analyzing",
  ACTION_REQUIRED = "Action Required",
  RESOLVED = "Resolved",
  UNDER_REVIEW = "Under Review",
  CLEAN = "Clean",
}

export type IssueCategory = "Duplicate" | "Upcoding" | "Unbundling" | "Inflation" | "Insurance Error" | "Other";
export type IssueSeverity = "High" | "Medium" | "Low";

export interface BillIssue {
  title: string;
  description: string;
  estimatedOvercharge: number;
  category: IssueCategory;
  severity: IssueSeverity;
}

export interface UserInsuranceInput {
  hasInsurance: boolean;
  provider: string; // e.g. "Sehat Sahulat", "Jubilee"
  planName: string; // e.g. "Gold", "Basic"
}

export interface InsuranceDetails {
  detectedProvider: string | null;
  policyNumber: string | null;
  claimedAmount: number | null;
  coveredAmount: number | null;
  patientResponsibility: number | null;
  status: "Not Found" | "Pending" | "Applied" | "Rejected" | "Not Covered";
}

export interface AnalysisResult {
  hospitalName: string;
  dateOfService: string;
  currency: string;
  locale: string;
  totalAmount: number;
  insurance: InsuranceDetails;
  confidenceScore: number;
  issues: BillIssue[];
  summary: string;
  verificationMethodology: string[]; // Steps taken by AI to verify
}

export interface BillRecord extends AnalysisResult {
  id: string;
  status: BillStatus;
  uploadDate: string;
  rawImage: string; // Base64
  userInsurance?: UserInsuranceInput; // Store what the user entered
}

export interface DisputeGuide {
  letter: string;
  steps: string[];
}
