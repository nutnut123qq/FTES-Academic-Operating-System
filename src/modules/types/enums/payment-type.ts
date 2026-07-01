/**
 * Payment channel for course checkout (matches GraphQL `PaymentType` / backend `PaymentType`).
 */
export enum PaymentType {
    /** PayOS — Vietnamese open-banking payment gateway (domestic). */
    PayOS = "payos",
    /** SePay — Vietnamese QR-code bank-transfer payment gateway (domestic). */
    Sepay = "sepay",
    /** Stripe — global card payment gateway (international). */
    Stripe = "stripe",
    /** PayPal — global wallet payment gateway (international). */
    Paypal = "paypal",
    /** Crypto — stablecoin (USDT/USDC) payment gateway (international). */
    Crypto = "crypto",
}
