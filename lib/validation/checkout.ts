import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  // IDs of the selected value within each ProductOptionGroup, e.g. { "<groupId>": "<valueId>" }
  selectedOptionValueIds: z.record(z.string(), z.string()).default({}),
});

export const checkoutAddressSchema = z.object({
  label: z.string().min(1).max(60).default("Delivery address"),
  recipientName: z.string().min(2).max(100),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[0-9+\s-]+$/, "Enter a valid phone number"),
  addressLine1: z.string().min(3).max(200),
  addressLine2: z.string().max(200).optional(),
  area: z.string().min(1).max(100),
  city: z.string().min(1).max(100).default("Dubai"),
  emirate: z.string().min(1).max(60).default("Dubai"),
  deliveryInstructions: z.string().max(500).optional(),
});

export const checkoutCustomerSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[0-9+\s-]+$/, "Enter a valid phone number"),
});

export const checkoutSchema = z.object({
  customer: checkoutCustomerSchema,
  address: checkoutAddressSchema,
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),
  deliveryDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid delivery date"),
  deliverySlotId: z.string().min(1, "Choose a delivery time slot"),
  couponCode: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
