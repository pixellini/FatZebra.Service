import 'core-js/stable'
import 'regenerator-runtime/runtime'
import fetchJsonp from 'fetch-jsonp'
import { isLength } from 'validator'

// Constants
const RESPONSE_CODES = {
    '1': 'SUCCESS',
    '95': 'INVALID_USERNAME',
    '97': 'INVALID_VALIDATION',
    '99': 'INVALID_VERIFICATION',
    '999': 'GATEWAY_ERROR'
}
const REQUIRED_KEYS = [
    'card_holder',
    'card_number',
    'expiry_month',
    'expiry_year',
    'cvv',
    'is_billing',
    'return_path',
    'verification',
]
const ERROR_GENERIC = '[Fat Zebra] | Something went wrong'
const ERROR_URL_NOT_PROVIDED = '[Fat Zebra] | URL not provided'
const ERROR_URL_NOT_STRING = '[Fat Zebra] | URL must be of type string'
const ERROR_KEY_NOT_PROVIDED = '[Fat Zebra] | %KEY% is empty'
const ERROR_INVALID_CARD_HOLDER = '[Fat Zebra] | Card holder name is invalid'
const ERROR_INVALID_CARD_NUMBER = '[Fat Zebra] | Card number is invalid'
const ERROR_INVALID_CVV = '[Fat Zebra] | CVV is invalid'
const ERROR_INVALID_EXPIRY = '[Fat Zebra] | Expiry date has already passed'

/**
 * Client integration for a FatZebra instance.
 * This allows direct card tokenization api calls.
 * 
 * @name FatZebraService
 * @example const fatZebra = new FatZebraService('https://url.com')
 * await zebraService.tokenizeCard({
 *     "card_holder": "John Smith",
 *     "card_number": "4005 5500 0000 0001",
 *     "expiry_month": 2,
 *     "expiry_year": 2023,
 *     "cvv": "255",
 *     "is_billing": false,
 *     "return_path": "au.com.lunchfox",
 *     "verification": "0050e20fb44e12f7f091f48ebfa63565"
 * })
 */
class FatZebraService {
    url = ''

    constructor (url) {
        if (!url || url === '') {
            throw(ERROR_URL_NOT_PROVIDED)
        }

        if (typeof url !== 'string') {
            throw(ERROR_URL_NOT_STRING)
        }

        this.url = url
    }

    hasEmptyValue = (data = {}) => {
        return REQUIRED_KEYS.find(key => {
            let value = data[key]
            
            if (typeof value === 'number') {
                value = value.toString()
            }

            return value === undefined || value === null || value === ''
        })
    }

    verifyPayload (data = {}) {
        const emptyDataKey = this.hasEmptyValue(data)
        if (emptyDataKey) {
            throw(ERROR_KEY_NOT_PROVIDED.replace('%KEY%', emptyDataKey))
        }

        if (data.card_holder && !isLength(data.card_holder.trim(), { min: 2, max: 50 })) {
            throw(ERROR_INVALID_CARD_HOLDER)
        }

        if (data.card_number && !isLength(data.card_number.trim(), { min: 16 })) {
            throw(ERROR_INVALID_CARD_NUMBER)
        }

        if (data.cvv && !isLength(data.cvv.trim(), { min: 3 })) {
            throw(ERROR_INVALID_CVV)
        }

        const expiry = new Date(data.expiry_year, data.expiry_month)
        const now = new Date()

        if(expiry.getTime() < now.getTime()) {
            throw(ERROR_INVALID_EXPIRY)
        }
    }

    async tokenizeCard (data = {}) {
        try {
            this.verifyPayload(data)

            const params = new URLSearchParams(data).toString()

            const response = await fetchJsonp(this.url + '?' + params)
            const jsonResponse = await response.json()

            this.checkResponseForErrors(jsonResponse)
            
            return jsonResponse
        } 
        catch (error) {
            throw(error)
        }
    }

    checkResponseForErrors = (res = {}) => {
        if (!res || !res.r) {
            throw(ERROR_GENERIC)
        }

        if (res.r !== 1) {
            const errorObj = {
                status: res.r,
                code: RESPONSE_CODES[ res.r ]
            }

            throw(JSON.stringify(errorObj))
        }
    }
}

export default FatZebraService