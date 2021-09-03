# Fat Zebra Service
A client side service to tokenize a payment card for a user, eliminating the need to store payment details server side.

This service will also provide basic validation on all the fields that are required to creating a card token.

## Example
``` javascript
import FatZebraService from '@pixellini/fat-zebra'

// Create your Fat Zebra instance
const myFatZebraInstance = new FatZebraService({
    url: 'https://gateway.pmnts-sandbox.io/v2/credit_cards/direct/TEST.json',
    return_path: "au.com.organisation",
    verification: "0011e24pn55e12f7f331f48ejrf03948"
})

try {
    // Tokenize card details
    const tokenizedCard = await myFatZebraInstance.tokenizeCard({
        card_holder: 'Jake Pixellini',
        card_number: '5123 4567 8901 2346',
        expiry_month: 05,
        expiry_year: 2030,
        cvv: '100',
        is_billing: false
    })

    if (tokenizedCard.token) {
        // Tokenize successful
    }
}
catch (error) {
    // Catch the error that was thrown
}
```