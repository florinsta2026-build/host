import type { PaymentProvider } from "./types";
import { ziinaProvider } from "./ziina";

const providers: Record<string, PaymentProvider> = {
  ziina: ziinaProvider,
  // tabby: tabbyProvider,   // add when Tabby is wired up — same interface
  // stripe: stripeProvider,
};

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "ziina";
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Unknown PAYMENT_PROVIDER "${name}". Supported: ${Object.keys(providers).join(", ")}.`
    );
  }
  return provider;
}
