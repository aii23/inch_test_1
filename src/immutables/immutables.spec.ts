import {Address} from '@1inch/fusion-sdk'
import {Immutables} from './immutables'
import {TimeLocks} from '../cross-chain-order/time-locks/time-locks'
import {HashLock} from '../cross-chain-order/hash-lock'

describe('Immutables', function () {
    // values from contract tests
    const immutables = Immutables.new({
        orderHash:
            '0x47bb61560b511b196788026f8de50c213051732f2c4abfeb855f1bdf0825aa1f',
        hashLock: HashLock.fromString(
            '0xc54045fa7c6ec765e825df7f9e9bf9dec12c5cef146f93a5eee56772ee647fbc'
        ),
        maker: Address.fromBigInt(
            383079593504046113366356564994826494389704707888n
        ),
        taker: Address.fromBigInt(
            366443055401047251047893360440697731881434542072n
        ),
        token: Address.fromBigInt(
            1405310203571408291950365054053061012934685786634n
        ),
        amount: 150000000000000000n,
        safetyDeposit: 30000000000000000n,
        timeLocks:
            TimeLocks.fromBigInt(
                24263952003825210752747571682508896791736523869669408224653997988904961n
            )
    })
    it('Should calc correct hash of immutables', function () {
        expect(immutables.hash()).toEqual(
            '0xa0064b1f7adf195756a63a5df5d7ce6dc9fc327e7a6b0ecdd6758ac791460abd'
        )
    })

    it('Should encode/decode', () => {
        expect(Immutables.decode(immutables.encode())).toEqual(immutables)
    })
})
