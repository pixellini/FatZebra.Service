import FatZebraService from './fat-zebra'
import fetchJsonp from 'fetch-jsonp'
import { expect, jest } from '@jest/globals'

jest.mock('fetch-jsonp')

describe('FatZebra Service', () => {
    let zebraService 

    beforeEach(() => {
        zebraService = new FatZebraService('http://localhost:3000/fake-url')
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
            "card_number": "4005 5500 0000 0001",
            "expiry_month": 2,
            "expiry_year": 2023,
            "cvv": "255",
            "is_billing": false,
            "return_path": "au.com.lunchfox",
            "verification": "0050e20fb44e12f7f091f48ebfa63565"
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
                "is_billing": false,
                "return_path": "au.com.lunchfox",
                "verification": "0050e20fb44e12f7f091f48ebfa63565"
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
        ${ 'is_billing' }
        ${ 'return_path' }
        ${ 'verification' }
    `('should throw an error when $dataKey is empty', async ({ dataKey }) => {
        // Arrange
        const expectedError = `[Fat Zebra] | ${ dataKey } is empty`
        const dataObject = {
            "card_holder": "John Smith",
            "card_number": "4005 5500 0000 0001",
            "expiry_month": 2,
            "expiry_year": 2023,
            "cvv": "255",
            "is_billing": false,
            "return_path": "au.com.lunchfox",
            "verification": "0050e20fb44e12f7f091f48ebfa63565"
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
        // console.log(dataKey, dataObject)

        try {
            await zebraService.tokenizeCard(dataObject)
        } 
        catch (error) {
            // Assert
            expect(error).toEqual(expectedError)
        }
    })
})