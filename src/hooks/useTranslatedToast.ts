import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * A hook that provides translated toast notifications
 * @returns A toast object with translated methods
 */
export const useTranslatedToast = () => {
  const { toast } = useToast();
  const { t } = useTranslation(["common", "errors"]);

  return {
    /**
     * Show a success toast with translated messages
     * @param key The translation key for the title
     * @param options Options for the toast
     */
    success: (
      titleKey: string,
      options?: {
        descriptionKey?: string;
        namespace?: string;
        duration?: number;
        titleParams?: Record<string, any>;
        descriptionParams?: Record<string, any>;
      }
    ) => {
      const ns = options?.namespace || "common";
      return toast({
        title: t(`${ns}:${titleKey}`, options?.titleParams),
        description: options?.descriptionKey
          ? t(`${ns}:${options.descriptionKey}`, options?.descriptionParams)
          : undefined,
        duration: options?.duration || 5000,
      });
    },

    /**
     * Show an error toast with translated messages
     * @param key The translation key for the title
     * @param options Options for the toast
     */
    error: (
      titleKey: string,
      options?: {
        descriptionKey?: string;
        namespace?: string;
        duration?: number;
        titleParams?: Record<string, any>;
        descriptionParams?: Record<string, any>;
      }
    ) => {
      const ns = options?.namespace || "errors";
      return toast({
        title: t(`${ns}:${titleKey}`, options?.titleParams),
        description: options?.descriptionKey
          ? t(`${ns}:${options.descriptionKey}`, options?.descriptionParams)
          : undefined,
        variant: "destructive",
        duration: options?.duration || 5000,
      });
    },

    /**
     * Show an info toast with translated messages
     * @param key The translation key for the title
     * @param options Options for the toast
     */
    info: (
      titleKey: string,
      options?: {
        descriptionKey?: string;
        namespace?: string;
        duration?: number;
        titleParams?: Record<string, any>;
        descriptionParams?: Record<string, any>;
      }
    ) => {
      const ns = options?.namespace || "common";
      return toast({
        title: t(`${ns}:${titleKey}`, options?.titleParams),
        description: options?.descriptionKey
          ? t(`${ns}:${options.descriptionKey}`, options?.descriptionParams)
          : undefined,
        duration: options?.duration || 5000,
      });
    },

    /**
     * Show a loading toast with translated messages
     * @param key The translation key for the title
     * @param options Options for the toast
     */
    loading: (
      titleKey: string,
      options?: {
        descriptionKey?: string;
        namespace?: string;
        duration?: number;
        titleParams?: Record<string, any>;
        descriptionParams?: Record<string, any>;
      }
    ) => {
      const ns = options?.namespace || "common";
      return toast({
        title: t(`${ns}:${titleKey}`, options?.titleParams),
        description: options?.descriptionKey
          ? t(`${ns}:${options.descriptionKey}`, options?.descriptionParams)
          : undefined,
        variant: "default",
        duration: options?.duration || 5000,
      });
    },

    // Original toast function for custom cases
    toast,
  };
};
