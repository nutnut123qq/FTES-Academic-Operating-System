
// we represent as a function to ensure optional loading or logic processing
export const assetConfig = () => {
    const icon = () => {
        const iconsPath = "/icons"
        const payment = () => {
            const paymentPath = `${iconsPath}/payment`
            return {
                payos: `${paymentPath}/payos.svg`,
                sepay: `${paymentPath}/sepay.svg`,
                stripe: `${paymentPath}/stripe.svg`,
                paypal: `${paymentPath}/paypal.svg`,
                crypto: `${paymentPath}/crypto.svg`,
            }
        }
        const submissions = () => {
            const submissionPath = `${iconsPath}/submissions`
            return {
                github: `${submissionPath}/github.svg`,
                google: `${submissionPath}/google-docs.svg`,
            }
        }
        return {
            payment,
            submissions,
        }
    }
    return {
        icon,
    }
}