import {Address} from '@1inch/fusion-sdk'
import {AbiCoder, keccak256} from 'ethers'
import {isHexBytes} from '@1inch/byte-utils'
import assert from 'assert'
import {HashLock} from '../cross-chain-order/hash-lock'
import {TimeLocks} from '../cross-chain-order/time-locks'

/**
 * Contract representation of class
 */
export type ImmutablesData = {
    orderHash: string
    hashlock: string
    maker: string
    taker: string
    token: string
    amount: string
    safetyDeposit: string
    timelocks: string
}

/**
 * Contains escrow params for both source and destination chains
 * Determinate addresses of escrow contracts
 */
export class Immutables {
    public static readonly Web3Type = `tuple(${[
        'bytes32 orderHash',
        'bytes32 hashlock',
        'address maker',
        'address taker',
        'address token',
        'uint256 amount',
        'uint256 safetyDeposit',
        'uint256 timelocks'
    ]})`

    private constructor(
        public readonly orderHash: string,
        public readonly hashLock: HashLock,
        public readonly maker: Address,
        public readonly taker: Address,
        public readonly token: Address,
        public readonly amount: bigint,
        public readonly safetyDeposit: bigint, // todo: separate class
        public readonly timeLocks: TimeLocks
    ) {}

    public static new(params: {
        orderHash: string
        hashLock: HashLock
        maker: Address
        taker: Address
        token: Address
        amount: bigint
        safetyDeposit: bigint
        timeLocks: TimeLocks
    }): Immutables {
        return new Immutables(
            params.orderHash,
            params.hashLock,
            params.maker,
            params.taker,
            params.token,
            params.amount,
            params.safetyDeposit,
            params.timeLocks
        )
    }

    /**
     * Create instance from encoded bytes
     * @param bytes 0x prefixed hex string
     */
    public static decode(bytes: string): Immutables {
        assert(isHexBytes(bytes))
        const res = AbiCoder.defaultAbiCoder().decode(
            [Immutables.Web3Type],
            bytes
        )
        const data = res.at(0) as ImmutablesData

        return new Immutables(
            data.orderHash,
            HashLock.fromString(data.hashlock),
            new Address(data.maker),
            new Address(data.taker),
            new Address(data.token),
            BigInt(data.amount),
            BigInt(data.safetyDeposit),
            TimeLocks.fromBigInt(BigInt(data.timelocks))
        )
    }

    /**
     * Return keccak256 hash of instance
     */
    public hash(): string {
        return keccak256(this.encode())
    }

    public build(): ImmutablesData {
        return {
            orderHash: this.orderHash,
            hashlock: this.hashLock.toString(),
            maker: this.maker.toString(),
            taker: this.taker.toString(),
            token: this.token.toString(),
            amount: this.amount.toString(),
            safetyDeposit: this.safetyDeposit.toString(),
            timelocks: this.timeLocks.build().toString()
        }
    }

    /**
     * Encode instance as bytes
     */
    public encode(): string {
        return AbiCoder.defaultAbiCoder().encode(
            [Immutables.Web3Type],
            [this.build()]
        )
    }
}
