import { z } from "zod";

import {
  OPERATION_REQUIRED_MESSAGE,
  operandsMessage,
  unknownOperationMessage,
} from "./messages.ts";
import { OPERAND_COUNT, OPERATIONS, type Operation } from "./operations.ts";

const operationSchema = z.enum(OPERATIONS, {
  error: (issue) =>
    typeof issue.input === "string"
      ? unknownOperationMessage(issue.input)
      : OPERATION_REQUIRED_MESSAGE,
});

/** Exactly `OPERAND_COUNT[operation]` finite numbers: `z.number()` rejects `NaN` and `±Infinity`. */
const operandsSchema = (operation: Operation) =>
  z.array(z.number()).length(OPERAND_COUNT[operation]);

/**
 * The enum parses first and the operands only in the transform, so a request
 * wrong in both ways gets the operation's message.
 */
export const calculateRequestSchema = z
  .object(
    { operation: operationSchema, operands: z.unknown().optional() },
    // A body that is not an object has no `operation` either.
    { error: OPERATION_REQUIRED_MESSAGE },
  )
  .transform(({ operation, operands }, ctx) => {
    const parsed = operandsSchema(operation).safeParse(operands);
    if (!parsed.success) {
      ctx.addIssue({ code: "custom", message: operandsMessage(operation) });
      return z.NEVER;
    }
    return { operation, operands: parsed.data };
  });

export type CalculateRequest = z.infer<typeof calculateRequestSchema>;

/** The success body of `POST /calculate`. */
export type CalculateResponse = {
  result: number;
};
