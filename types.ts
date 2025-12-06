export enum BillStatus {
  ANALYZING = 'Analyzing',
  ACTION_REQUIRED = 'Action Required',
  RESOLVED = 'Resolved',
  UNDER_REVIEW = 'Under Review',
  CLEAN = 'Clean'
}

export type IssueCategory = 'Duplicate' | 'Upcoding' | 'Unbundling' | 'Inflation' | 'Other';
export type IssueSeverity = 'High' | 'Medium' | 'Low';

export interface BillIssue {
  title: string;
  description: string;
  estimatedOvercharge: number;
  category: IssueCategory;
  severity: IssueSeverity;
}

export interface AnalysisResult {
  hospitalName: string;
  dateOfService: string;
  totalAmount: number;
  confidenceScore: number;
  issues: BillIssue[];
  summary: string;
}

export interface BillRecord extends AnalysisResult {
  id: string;
  status: BillStatus;
  uploadDate: string;
  rawImage: string; // Base64
}

export interface DisputeGuide {
  letter: string;
  steps: string[];
}
