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

    it('should fail', async () => {
        // Arrange
        const responseData = {
            r: 99
        }
        
        fetchJsonp.mockResolvedValueOnce({ 
            json: () => {
                return responseData
            } 
        })

        // Act
        try {
            const response = () => zebraService.tokenizeCard({
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
            console.log(error)
            // Assert
            expect(error).toBe('')
        }

    })
})