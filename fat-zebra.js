const fetchJsonp = require('fetch-jsonp')
const validator = require('validator')

const { isLength } = validator

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
    'cvv'
]
const ERROR_GENERIC             = 'Something went wrong. Please check your details and try again later.'
const ERROR_URL_NOT_PROVIDED    = 'URL not provided'
const ERROR_URL_NOT_STRING      = 'URL must be of type string'
const ERROR_KEY_NOT_PROVIDED    = '%KEY% is empty.'
const ERROR_INVALID_CARD_HOLDER = 'Card holder name is invalid.'
const ERROR_INVALID_CARD_NUMBER = 'Card number is invalid.'
const ERROR_INVALID_CVV         = 'CVV is invalid.'
const ERROR_INVALID_EXPIRY      = 'This expiry date has already passed.'

/**
 * Client integration for a FatZebra instance.
 * This allows direct card tokenization api calls.
 * 
 * @name FatZebraService
 * @author Pixellini
 * @example const fatZebra = new FatZebraService('https://url.com')
 * await zebraService.tokenizeCard({ ... })
 */
class FatZebraService {
    constructor ({ url = '', return_path = '', verification = '' }) {
        if (!url || url === '') {
            throw(ERROR_URL_NOT_PROVIDED)
        }

        if (typeof url !== 'string') {
            throw(ERROR_URL_NOT_STRING)
        }

        this.url = url
        this.return_path = return_path
        this.verification = verification
    }

    createErrorObject ({ status, message }) {
        return {
            status,
            statusCode: RESPONSE_CODES[status],
            message: message || ERROR_GENERIC
        }
    }

    /**
     * Checks if a property within the data payload is missing.
     * 
     * @param { Object } data - main data object
     * @returns { Boolean }
     */
    hasEmptyValue (data = {}) {
        return REQUIRED_KEYS.find(key => {
            let value = data[key]
            
            if (typeof value === 'number') {
                value = value.toString()
            }

            return value === undefined || value === null || value === ''
        })
    }

    /**
     * Validates the data object values.
     * 
     * @param { Object } data - main data object
     */
    verifyPayload (data = {}) {
        const emptyDataKey = this.hasEmptyValue(data)
        const expiry = new Date(data.expiry_year, data.expiry_month)
        const now = new Date()
        let message = ''

        if (emptyDataKey) {
            message = ERROR_KEY_NOT_PROVIDED.replace('%KEY%', emptyDataKey)
        }
        // No Card holder
        else if (!isLength(data.card_holder.trim(), { min: 2, max: 50 })) {
            message = ERROR_INVALID_CARD_HOLDER
        }
        // 
        else if (!isLength(data.card_number.trim(), { min: 16 })) {
            message = ERROR_INVALID_CARD_NUMBER
        }
        else if (!isLength(data.cvv.trim(), { min: 3 })) {
            message = ERROR_INVALID_CVV
        }
        else if(expiry.getTime() < now.getTime()) {
            message = ERROR_INVALID_EXPIRY
        }

        if (message) {
            throw(this.createErrorObject({
                status: 97,
                message
            }))
        }
    }

    /**
     * Checks for any potential FatZebra response status error codes.
     * 
     * @param { Object } res - should contain an "r" key for the response status
     */
    checkResponseForErrors (res = {}) {
        const { r: status } = res
        
        if (!status) {
            throw(this.createErrorObject({
                status: 999
            }))
        }

        if (status !== 1) {
            const errorObj = this.createErrorObject({ status })

            throw(JSON.stringify(errorObj))
        }
    }

    /**
     * Creates a card token.
     * 
     * @param { Object } data - main data object
     */
     async tokenizeCard (data = {}) {
        try {
            this.verifyPayload(data)

            const dataObj = {
                ...data,
                return_path: this.return_path,
                verification: this.verification
            }

            const params = new URLSearchParams(dataObj).toString()

            // Convert response into JSON format
            const response = await fetchJsonp(this.url + '?' + params)
            const jsonResponse = await response.json()

            this.checkResponseForErrors(jsonResponse)
            
            return jsonResponse
        } 
        catch (error) {
            throw(error)
        }
    }
}

module.exports = FatZebraService