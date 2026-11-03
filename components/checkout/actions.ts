// Shared form types. The create-business server action that used to live
// here was unused and bypassed the AI vetting and image checks, so it was
// removed. Registration goes through app/(public)/register-business/actions.ts.

export interface RegisterErrors {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  sittingCapacity?: string;
  coordinates?: string;
}

export interface RegisterState {
  success: boolean;
  message: string;
  errors?: RegisterErrors;
}
