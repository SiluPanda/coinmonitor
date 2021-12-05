import axios from 'axios'
import dotenv from 'dotenv'
import cron from 'node-cron'
dotenv.config()


export let availableCoins = new Set()
export let coinsDetails = {}

export async function fetchCoinsDetails() {
    try {
        console.log('fetching coin details...')
        let data = { "currency": "USD", "sort": "rank", "order": "ascending", "offset": 0, "limit": 100, "meta": true }
        let config = {
            headers: {
                'x-api-key': process.env.DATA_KEY
            }
        }

        let response = await axios.post(process.env.DATA_URL + '/coins/list', data, config)
        for (let coin of response.data) {
            coinsDetails[coin.code] = coin
            availableCoins.add(coin.code)
        }

    } catch (err) {
        console.log(`could not fetch coins, reason: ${err}`)
    }
}

cron.schedule('* * * * *', async () => {
    await fetchCoinsDetails()
})
