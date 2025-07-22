import { z } from "zod";
import i18n from "@/i18n/config";

/**
 * Creates a Zod schema with translated error messages
 * @param namespace The translation namespace to use
 * @returns A function that creates Zod schemas with translated error messages
 */
export const createTranslatedValidation = (namespace: string = "forms") => {
  const t = (key: string, options?: any) =>
    i18n.t(`${namespace}:${key}`, options);

  return {
    string: () =>
      z.string({
        required_error: t("validation.required"),
        invalid_type_error: t("validation.string"),
      }),

    email: () =>
      z
        .string({
          required_error: t("validation.required"),
          invalid_type_error: t("validation.string"),
        })
        .email(t("validation.email")),

    password: (minLength: number = 6) =>
      z
        .string({
          required_error: t("validation.required"),
          invalid_type_error: t("validation.string"),
        })
        .min(minLength, t("validation.minLength", { count: minLength })),

    number: () =>
      z.number({
        required_error: t("validation.required"),
        invalid_type_error: t("validation.numeric"),
      }),

    positiveNumber: () =>
      z
        .number({
          required_error: t("validation.required"),
          invalid_type_error: t("validation.numeric"),
        })
        .positive(t("validation.positive")),

    phone: () =>
      z
        .string({
          required_error: t("validation.required"),
          invalid_type_error: t("validation.string"),
        })
        .regex(/^\+?[0-9\s\-()]+$/, t("validation.phone")),

    taxCode: () =>
      z
        .string({
          required_error: t("validation.required"),
          invalid_type_error: t("validation.string"),
        })
        .regex(/^[A-Z0-9]{11,16}$/, t("validation.taxCode")),

    vatNumber: () =>
      z
        .string({
          required_error: t("validation.required"),
          invalid_type_error: t("validation.string"),
        })
        .regex(/^[A-Z0-9]{8,13}$/, t("validation.vatNumber")),
  };
};

/**
 * Creates a Zod schema with translated error messages using the forms namespace
 */
export const zod = createTranslatedValidation("forms");

/**
 * Helper function to create a Zod schema with translated error messages
 * @param buildSchema A function that builds a Zod schema using the provided validation helpers
 * @param namespace The translation namespace to use
 * @returns A Zod schema with translated error messages
 */
export const createSchema = <T extends z.ZodType>(
  buildSchema: (v: ReturnType<typeof createTranslatedValidation>) => T,
  namespace: string = "forms"
): T => {
  const validator = createTranslatedValidation(namespace);
  return buildSchema(validator);
};
