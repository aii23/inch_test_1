require('dotenv').config()

import {getRandomBytes32} from '../test-utils/get-random-bytes-32'
import {SDK, NetworkEnum, HashLock} from '..'
import {solidityPackedKeccak256} from 'ethers'

const makerPrivateKey =
    '4e01f7ce31b9fee23cbf4e8162c7f95b0a53ac95184fa5a7f9281750059ae9e9'
const makerAddress = '0x997Cdca3e27c847C5F9ae6a2552645b6430289c6'

const f = async () => {
    const sdk = new SDK({
        url: 'https://api.1inch.dev/fusion-plus',
        authKey: process.env.INCH_API_KEY!
    })

    const params = {
        srcChainId: NetworkEnum.BINANCE,
        dstChainId: NetworkEnum.GNOSIS,
        srcTokenAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        dstTokenAddress: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
        amount: '10000000000000000'
    }

    const quote = await sdk.getQuote(params as any)

    const secretsCount = quote.getPreset().secretsCount

    const secrets = Array.from({length: secretsCount}).map(() =>
        getRandomBytes32()
    )
    const secretHashes = secrets.map((x) => HashLock.hashSecret(x))

    const hashLock =
        secretsCount === 1
            ? HashLock.forSingleFill(secrets[0])
            : HashLock.forMultipleFills(
                  secretHashes.map((secretHash, i) =>
                      solidityPackedKeccak256(
                          ['uint64', 'bytes32'],
                          [i, secretHash.toString()]
                      )
                  ) as (string & {
                      _tag: 'MerkleLeaf'
                  })[]
              )

    sdk.placeOrder(quote, {
        walletAddress: makerAddress,
        hashLock,
        secretHashes,
        // fee is an optional field
        fee: {
            takingFeeBps: 100, // 1% as we use bps format, 1% is equal to 100bps
            takingFeeReceiver: '0x0000000000000000000000000000000000000000' //  fee receiver address
        }
    }).then(console.log)

    console.log(quote)
}

f().then(() => console.log('finally'))
