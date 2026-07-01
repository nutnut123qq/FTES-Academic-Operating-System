/** Params for {@link submitCheckout}. */
export interface SubmitCheckoutParams {
    /** Redirect URL (PayOS) or form action URL (SePay PG). */
    checkoutUrl: string
    /**
     * SePay PG only: JSON string of signed fields to POST as a form. When
     * absent/null the user is simply redirected to `checkoutUrl` (PayOS).
     */
    checkoutFields?: string | null
}

/**
 * Send the user to the payment gateway.
 *
 * - PayOS: a plain redirect to `checkoutUrl`.
 * - SePay PG: build a hidden `<form method="POST">` with the signed fields and
 *   auto-submit it to `checkoutUrl` (SePay requires a form POST, not a redirect).
 *
 * Must run in the browser (touches `document` / `window`).
 */
export const submitCheckout = ({
    checkoutUrl,
    checkoutFields,
}: SubmitCheckoutParams): void => {
    // no signed fields → redirect provider (PayOS)
    if (!checkoutFields) {
        window.location.href = checkoutUrl
        return
    }

    // SePay PG → POST the signed fields as a form
    const fields = JSON.parse(checkoutFields) as Record<string, string | number>
    const form = document.createElement("form")
    form.method = "POST"
    form.action = checkoutUrl
    for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = name
        input.value = String(value)
        form.appendChild(input)
    }
    document.body.appendChild(form)
    form.submit()
}
