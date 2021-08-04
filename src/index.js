import FatZebraService from './fat-zebra'
const URL = 'https://gateway.pmnts-sandbox.io/v2/credit_cards/direct/TEST.json'

async function main () {
    try {
        const fatZebra = new FatZebraService(URL)

        const res = await fatZebra.tokenizeCard({
            "card_holder": "John Smith",
            "card_number": "4005 5500 0000 0001",
            "expiry_month": 2,
            "expiry_year": 2023,
            "cvv": "255",
            "is_billing": false,
            "return_path": "au.com.lunchfox",
            "verification": "0050e20fb44e12f7f091f48ebfa63565"
        })
        console.log(res)
    }
    catch (error) {
        console.log(error)    
    }
}

main()