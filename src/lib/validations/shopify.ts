import { z } from "zod";

// The Admin API always addresses a store via its *.myshopify.com domain,
// regardless of any custom storefront domain the store also uses.
const shopDomain = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => v.replace(/^https?:\/\//, "").replace(/\/$/, ""))
  .pipe(
    z
      .string()
      .regex(
        /^[a-z0-9-]+\.myshopify\.com$/,
        "Enter your *.myshopify.com domain, e.g. my-store.myshopify.com",
      ),
  );

export const connectShopifySchema = z.object({
  shopDomain,
  clientId: z.string().trim().min(1, "Client ID is required"),
  clientSecret: z.string().trim().min(1, "Client secret is required"),
});
export type ConnectShopifyInput = z.infer<typeof connectShopifySchema>;

export const setTrackedProductSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  productTitle: z.string().min(1),
});
export type SetTrackedProductInput = z.infer<typeof setTrackedProductSchema>;
