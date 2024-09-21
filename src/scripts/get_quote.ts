require('dotenv').config()

import {SDK, NetworkEnum} from '..'

const f = async () => {
    const sdk = new SDK({
        url: 'https://api.1inch.dev/fusion-plus',
        authKey: process.env.INCH_API_KEY!
    })

    const params = {
        srcChainId: NetworkEnum.ETHEREUM as any,
        dstChainId: NetworkEnum.GNOSIS as any,
        srcTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
        dstTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        amount: '1000000000000000000000'
    }

    const quote = await sdk.getQuote(params)

    console.log(quote)
}

f().then(() => console.log('finally'))
