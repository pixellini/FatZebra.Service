const FatZebraService = require('./fat-zebra')
const fetchJsonp = require('fetch-jsonp')

jest.mock('fetch-jsonp')

describe('FatZebra Service', () => {
    let zebraService 

    beforeEach(() => {
        zebraService = new FatZebraService({
            url: 'http://localhost:3000/fake-url',
            return_path: 'au.com.lunchfox',
            verification: '0050e20fb44e12f7f091f48ebfa63565'
        })
    })

    it('should tokenize a card', async () => {
        // Arrange
        const responseData = {
            card_expiry: "02/2023",
            card_holder: "John Smith",
            card_number: "400555XXXXXX0001",
            r: 1,
            token: "thetoken",
            v: "randomgibberish"
        }

        fetchJsonp.mockResolvedValueOnce({ 
            json: () => {
                return responseData
            } 
        })

        // Act
        const response = await zebraService.tokenizeCard({
            "card_holder": "John Smith",
            "card_number": "4005550000000001",
            "expiry_month": 2,
            "expiry_year": 2023,
            "cvv": "255",
            "is_billing": false
        })

        // Assert
        expect(response).toBe(responseData)
    })

    it.each`
        statusCode  | errorCode
        ${ 99 }     | ${ 'INVALID_VERIFICATION' }
        ${ 95 }     | ${ 'INVALID_USERNAME' }
        ${ 97 }     | ${ 'INVALID_VALIDATION' }
        ${ 999 }    | ${ 'GATEWAY_ERROR' }
    `('should throw an error with a status code of $statusCode and return $errorCode as message code', async ({ statusCode, errorCode }) => {
        // Arrange
        const expectedErrorObject = JSON.stringify({
            status: statusCode,
            code: errorCode
        })
        const responseData = {
            r: statusCode
        }
        
        fetchJsonp.mockResolvedValueOnce({ 
            json: () => {
                return responseData
            } 
        })

        // Act
        try {
            await zebraService.tokenizeCard({
                "card_holder": "John Smith",
                "card_number": "4005 5500 0000 0001",
                "expiry_month": 2,
                "expiry_year": 2023,
                "cvv": "255",
                "is_billing": false
            })
        } 
        catch (error) {
            // Assert
            expect(error).toEqual(expectedErrorObject)
        }
    })

    it.each`
        dataKey
        ${ 'card_holder' }
        ${ 'card_number' }
        ${ 'expiry_month' }
        ${ 'expiry_year' }
        ${ 'cvv' }
    `('should throw an error when the required $dataKey key is empty', async ({ dataKey }) => {
        // Arrange
        const expectedError = `[Fat Zebra] | ${ dataKey } is empty`
        const dataObject = {
            "card_holder": "John Smith",
            "card_number": "4005 5500 0000 0001",
            "expiry_month": 2,
            "expiry_year": 2023,
            "cvv": "255",
            "is_billing": false
        }
        
        fetchJsonp.mockResolvedValueOnce({ 
            json: () => {
                return {
                    r: 1
                }
            } 
        })

        // Act
        delete dataObject[ dataKey ]

        try {
            await zebraService.tokenizeCard(dataObject)
            
            // Should not hit here. 
            // This is for when the tokenizeCard fails to throw the correct error.
            throw('Test failed')
        } 

        // Assert
        catch (error) {
            expect(error).toEqual(expectedError)
        }
    })
})