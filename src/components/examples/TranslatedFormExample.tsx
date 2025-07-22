import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { createSchema } from "@/lib/zodValidation";

// Example of a form with translated validation
const TranslatedFormExample = () => {
  const { t } = useTranslation(["forms", "auth"]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Create a schema with translated validation messages
  const formSchema = createSchema((v) =>
    z
      .object({
        name: v.string().min(2, t("validation.minLength", { count: 2 })),
        email: v.email(),
        password: v.password(8),
        confirmPassword: v.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: t("validation.passwordMismatch"),
        path: ["confirmPassword"],
      })
  );

  // Define the form with react-hook-form and zodResolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: t("auth:success.accountCreated"),
        description: t("auth:success.checkEmailConfirmation"),
      });

      form.reset();
    } catch (error) {
      toast({
        title: t("auth:errors.registrationFailed"),
        description: t("auth:errors.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{t("auth:register.title")}</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth:register.fullName")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("forms:placeholders.enterName")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth:register.email")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("forms:placeholders.enterEmail")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth:register.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("auth:register.passwordPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("auth:register.passwordRequirements")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth:register.confirmPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("auth:register.confirmPasswordPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? t("auth:register.creatingAccount")
              : t("auth:register.registerButton")}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default TranslatedFormExample;
