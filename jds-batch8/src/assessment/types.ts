import type { Answers } from "../lib/types.ts";
import type { Errors } from "../lib/validation.ts";

export type Update = (mutate: (draft: Answers) => void) => void;

export interface StepProps {
  answers: Answers;
  update: Update;
  errors: Errors;
}
