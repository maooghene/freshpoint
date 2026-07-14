// ./app/(public)/register-business/types.ts

export interface RegisterErrors {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  sittingCapacity?: string;
  image?: string;
  category?: string;
}

// Added the missing payload structure so aiGate.ts can compile safely
export interface AIValidationPayload {
  isValidIndustry: boolean;
  confidenceScore: number;
  reason: string;
}
