import 'core-js/stable'
import 'regenerator-runtime/runtime'
import fetchJsonp from 'fetch-jsonp'
import validator from 'validator'

const RESPONSE_CODES = {
    '1': 'SUCCESS',
    '95': 'USERNAME',
    '97': 'VALIDATION_ERROR',
    '99': 'INVALID_VERIFICATION',
    '999': 'GATEWAY_ERROR'
}

class PaymentService {
    url = ''

    constructor (url) {
        if (!url) {
            throw new Error('[Fat Zebra] | URL not provided')
        }
        this.url = url
    }

    verifyPayload (data) {
        if (!data.card_holder || !validator.isLength(data.card_holder.trim(), { min: 2, max: 50 })) {
            throw new Error('[Fat Zebra] | Card holder name is invalid')
        }

        if (!data.card_number || !validator.isLength(data.card_number.trim(), { min: 16 })) {
            throw new Error('[Fat Zebra] | Card number is invalid')
        }

        if (!data.cvv || !validator.isLength(data.cvv.trim(), { min: 3 })) {
            throw new Error('[Fat Zebra] | CVV is invalid')
        }

        const expiry = new Date(data.expiry_year, data.expiry_month)
        const now = new Date()

        if(expiry.getTime() < now.getTime()) {
            throw new Error('[Fat Zebra] | Expiry date is expired')
        }
    }

    async tokenizeCard (data) {
        try {
            this.verifyPayload(data)

            const params = new URLSearchParams(data).toString()

            const response = await fetchJsonp(this.url + '?' + params)
            const formattedResponse = await response.json()

            this.checkResponse(formattedResponse)
            
            return formattedResponse
        } 
        catch (error) {
            throw new Error(error)
        }
    }

    checkResponse = (res) => {
        if (!res || !res.r) {
            throw new Error('[Fat Zebra] | Something went wrong')
        }

        if (res.r !== 1) {
            const errorObj = {
                status: res.r,
                code: RESPONSE_CODES[ res.r ]
            }

            throw new Error(JSON.stringify(errorObj));
        }
    }
}

export default PaymentService