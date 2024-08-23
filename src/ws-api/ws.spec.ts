import {WebSocket, WebSocketServer} from 'ws'
import {NetworkEnum} from '@1inch/fusion-sdk'
import {WebSocketApi} from './ws-api'
import {
    GetActiveOrdersRpcEvent,
    GetAllowMethodsRpcEvent,
    OrderBalanceOrAllowanceChangeEvent,
    OrderCancelledEvent,
    OrderCreatedEvent,
    OrderEventType,
    OrderFilledEvent,
    OrderFilledPartiallyEvent,
    OrderInvalidEvent,
    PingRpcEvent
} from './types'
import {castUrl} from './url'
import {WebsocketClient} from '../connector'

jest.setTimeout(5 * 60 * 1000)

describe(__filename, () => {
    const availableEventsTypes = [
        'order_created',
        'order_invalid',
        'order_balance_or_allowance_change',
        'order_filled',
        'order_filled_partially',
        'order_cancelled',
        'secret_shared'
    ] as const

    describe('base', () => {
        it('should be possible to subscribe to message', (done) => {
            const message = {id: 1}
            const {wss, url} = createWebsocketServerMock([message])

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            wsSdk.onMessage((data) => {
                expect(data).toEqual(message)
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('should be possible to subscribe to open connection', (done) => {
            const message = {id: 1}
            const {wss, url} = createWebsocketServerMock([message])

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('this is pointed to underlying websocket', (done) => {
            const message = {id: 1}
            const {wss, url} = createWebsocketServerMock([message])

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            wsSdk.on('open', function (this: WebSocket) {
                expect(this).toBeInstanceOf(WebSocket)
                this.close()
                wss.close()
                done()
            })
        })

        // TODO repair waiting a lot of time ....
        xit('should be possible to subscribe to error', (done) => {
            const wsSdk = new WebSocketApi({
                url: 'ws://localhost:2345',
                network: NetworkEnum.ETHEREUM
            })

            wsSdk.on('error', (error) => {
                expect(error.message).toContain('ECONNREFUSED')
                wsSdk.close()
                done()
            })
        })

        it('should be possible to initialize in lazy mode', (done) => {
            const message = {id: 1}
            const port = 8080

            const url = `ws://localhost:${port}/ws`
            const wss = new WebSocketServer({port, path: '/ws/v2.0/1'})

            wss.on('connection', (ws: WebSocket) => {
                for (const m of [message]) {
                    ws.send(JSON.stringify(m))
                }
            })

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                lazyInit: true,
                authKey: ''
            })

            expect(wsSdk.provider).toMatchObject({initialized: false})

            wsSdk.init()

            expect(wsSdk.provider).toMatchObject({initialized: true})

            wsSdk.onMessage((data) => {
                expect(data).toEqual(message)

                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('should be safe to call methods on uninitialized ws', () => {
            const wsSdk = new WebSocketApi({
                url: 'random',
                network: NetworkEnum.ETHEREUM,
                lazyInit: true
            })

            expect(() => wsSdk.send({id: 1})).toThrowError()
        })

        it('should be possible to initialize not in lazy mode', (done) => {
            const message = {id: 1}
            const port = 8080

            const url = `ws://localhost:${port}/ws`
            const wss = new WebSocketServer({port, path: '/ws/v2.0/1'})

            wss.on('connection', (ws: WebSocket) => {
                for (const m of [message]) {
                    ws.send(JSON.stringify(m))
                }
            })

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                lazyInit: false
            })

            expect(wsSdk).toBeDefined()

            wsSdk.onMessage((data) => {
                expect(data).toEqual(message)

                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('should be possible to pass provider instead of config', (done) => {
            const message = {id: 1}
            const port = 8080

            const url = `ws://localhost:${port}/ws`
            const wss = new WebSocketServer({port, path: '/ws/v2.0/1'})

            wss.on('connection', (ws: WebSocket) => {
                for (const m of [message]) {
                    ws.send(JSON.stringify(m))
                }
            })

            const castedUrl = castUrl(url)
            const urlWithNetwork = `${castedUrl}/v2.0/1`
            const provider = new WebsocketClient({url: urlWithNetwork})

            const wsSdk = new WebSocketApi(provider)

            expect(wsSdk.rpc).toBeDefined()
            expect(wsSdk.order).toBeDefined()

            expect(wsSdk).toBeDefined()

            wsSdk.onMessage((data) => {
                expect(data).toEqual(message)

                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('should be possible to initialize with new method', (done) => {
            const message = {id: 1}
            const port = 8080

            const url = `ws://localhost:${port}/ws`
            const wss = new WebSocketServer({port, path: '/ws/v2.0/1'})

            wss.on('connection', (ws: WebSocket) => {
                for (const m of [message]) {
                    ws.send(JSON.stringify(m))
                }
            })

            const castedUrl = castUrl(url)
            const urlWithNetwork = `${castedUrl}/v2.0/1`
            const provider = new WebsocketClient({
                url: urlWithNetwork,
                authKey: ''
            })

            const wsSdk = WebSocketApi.new(provider)

            expect(wsSdk.rpc).toBeDefined()
            expect(wsSdk.order).toBeDefined()

            expect(wsSdk).toBeDefined()

            wsSdk.onMessage((data) => {
                expect(data).toEqual(message)

                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('connection can be closed and you can listen to close event', (done) => {
            const message = {id: 1}
            const {wss, url} = createWebsocketServerMock([message])

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            wsSdk.onClose(() => {
                wss.close()
                done()
            })

            wsSdk.onOpen(() => {
                wsSdk.close()
            })
        })
    })

    describe('rpc', () => {
        it('can ping pong ', (done) => {
            const response: PingRpcEvent = {
                method: 'ping',
                data: {
                    timestampUtcMs: Date.now()
                }
            }
            const {url, wss} = createWebsocketRpcServerMock((ws, data) => {
                const parsedData = JSON.parse(data)

                if (parsedData.method === 'ping') {
                    ws.send(JSON.stringify(response))
                }
            })

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                wsSdk.rpc.ping()
            })

            wsSdk.rpc.onPong((data) => {
                expect(data).toEqual(response.data)
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('can retrieve allowed rpc methods ', (done) => {
            const response: GetAllowMethodsRpcEvent = {
                method: 'getAllowedMethods',
                data: ['ping', 'getAllowedMethods', 'getActiveOrders']
            }
            const {url, wss} = createWebsocketRpcServerMock((ws, data) => {
                const parsedData = JSON.parse(data)

                if (parsedData.method === 'getAllowedMethods') {
                    ws.send(JSON.stringify(response))
                }
            })

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                wsSdk.rpc.getAllowedMethods()
            })

            wsSdk.rpc.onGetAllowedMethods((data) => {
                expect(data).toEqual(response.data)
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('getActiveOrders success', (done) => {
            const response: GetActiveOrdersRpcEvent = {
                method: 'getActiveOrders',
                data: {
                    items: [],
                    meta: {
                        totalItems: 0,
                        totalPages: 0,
                        itemsPerPage: 0,
                        currentPage: 0
                    }
                }
            }
            const {url, wss} = createWebsocketRpcServerMock((ws, data) => {
                const parsedData = JSON.parse(data)

                if (parsedData.method === 'getActiveOrders') {
                    ws.send(JSON.stringify(response))
                }
            })

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                wsSdk.rpc.getActiveOrders()
            })

            wsSdk.rpc.onGetActiveOrders((data) => {
                expect(data).toEqual(response.data)
                wsSdk.close()
                wss.close()
                done()
            })
        })

        it('getActiveOrders throws error', (done) => {
            const response: GetActiveOrdersRpcEvent = {
                method: 'getActiveOrders',
                data: {
                    items: [],
                    meta: {
                        totalItems: 0,
                        totalPages: 0,
                        itemsPerPage: 0,
                        currentPage: 0
                    }
                }
            }
            const {url, wss} = createWebsocketRpcServerMock((ws, data) => {
                const parsedData = JSON.parse(data)

                if (parsedData.method === 'getActiveOrders') {
                    ws.send(JSON.stringify(response))
                }
            })

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            wsSdk.onOpen(() => {
                try {
                    wsSdk.rpc.getActiveOrders({page: -1})
                } catch (error) {
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })
    })

    describe('order', () => {
        it('can subscribe to order events', (done) => {
            const message1: OrderCreatedEvent = {
                type: 'order_created',
                data: {
                    quoteId: 'b77da8b7-a4bb-4563-b917-03522aa609e3',
                    orderHash:
                        '0xb9522c23c8667c5e76bf0b855ffabbaebca282f8e396d788c2df75e91a0391d2-5705f2156ef5b2db36c160b36f31ce4',
                    order: {
                        salt: '9445680545936410419330284706951757224702878670220689583677680607556412140293',
                        maker: '0x6edc317f3208b10c46f4ff97faa04dd632487408',
                        receiver: '0x0000000000000000000000000000000000000000',
                        makerAsset:
                            '0x6b175474e89094c44da98b954eedeac495271d0f',
                        takerAsset:
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        makerTraits:
                            '62419173104490761595518734106557662061518414611782227068396304425790442831872',
                        makingAmount: '30000000000000000000',
                        takingAmount: '7516665910385115'
                    },
                    signature:
                        '0xb51731d6e62754ae75d11d13983c19b25fcc1a43fc327710a26ae291fde3d33f52dee7a4c0154256f6bb272260170128242034a89f44e7e887d1bb54a746a5941b',
                    extension:
                        '0x000000cb0000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b840662fb9efb09498030ae3416b66dc00007bf29735c20c566e5a0c0000950fa635aec75b30781a0000d18bd45f0b94f54a968f000076d49414ad2b8371a4220000a59ca88d5813e693528f000038700d5181a674fdb9a2000038',
                    srcChainId: NetworkEnum.ETHEREUM,
                    dstChainId: NetworkEnum.POLYGON,
                    isMakerContract: false,
                    merkleLeaves: [
                        '0x71ad135b040d726eb59a9f718db4d9c9ab93eee0aa072a92569f24ac2f4e314a',
                        '0xfe9789f805bd764824c94a1d764776c3177f92c9ee3d3a1c074c314d2af30bd7',
                        '0x00b2a24fd759c4093935c5268b5cc187b9b15bf287230439453e65e67191902e'
                    ],
                    secretHashes: [
                        '0x2048b38093dc53876b2bbd230ee8999791153db01de425112f449d018094e116',
                        '0x7972c1498893bb9b88baddc9decb78d8defdcc7a182a72edd8724498c75f088d',
                        '0x6d5b8f0b1f8a28564ff65e5f9c4d8a8a6babfb318bca6ecc9d872a3abe8a4ea0'
                    ]
                },
                availableEvents: availableEventsTypes
            }

            const message2: OrderInvalidEvent = {
                type: 'order_invalid',
                data: {
                    orderHash:
                        '0x1beee023ab933cf5446c298eaddb61c0-5705f2156ef5b2db36c160b36f31ce4'
                },
                availableEvents: availableEventsTypes
            }

            const messages = [message1, message1, message2]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrder((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 3) {
                    expect(resArray).toEqual(messages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })

        it('can subscribe to order created events', (done) => {
            const message1: OrderCreatedEvent = {
                type: 'order_created',
                data: {
                    quoteId: 'b77da8b7-a4bb-4563-b917-03522aa609e3',
                    orderHash:
                        '0xb9522c23c8667c5e76bf0b855ffabbaebca282f8e396d788c2df75e91a0391d2-5705f2156ef5b2db36c160b36f31ce4',
                    order: {
                        salt: '9445680545936410419330284706951757224702878670220689583677680607556412140293',
                        maker: '0x6edc317f3208b10c46f4ff97faa04dd632487408',
                        receiver: '0x0000000000000000000000000000000000000000',
                        makerAsset:
                            '0x6b175474e89094c44da98b954eedeac495271d0f',
                        takerAsset:
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        makerTraits:
                            '62419173104490761595518734106557662061518414611782227068396304425790442831872',
                        makingAmount: '30000000000000000000',
                        takingAmount: '7516665910385115'
                    },
                    signature:
                        '0xb51731d6e62754ae75d11d13983c19b25fcc1a43fc327710a26ae291fde3d33f52dee7a4c0154256f6bb272260170128242034a89f44e7e887d1bb54a746a5941b',
                    extension:
                        '0x000000cb0000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b840662fb9efb09498030ae3416b66dc00007bf29735c20c566e5a0c0000950fa635aec75b30781a0000d18bd45f0b94f54a968f000076d49414ad2b8371a4220000a59ca88d5813e693528f000038700d5181a674fdb9a2000038',
                    srcChainId: NetworkEnum.POLYGON,
                    dstChainId: NetworkEnum.ETHEREUM,
                    isMakerContract: false,
                    merkleLeaves: [
                        '0x71ad135b040d726eb59a9f718db4d9c9ab93eee0aa072a92569f24ac2f4e314a',
                        '0xfe9789f805bd764824c94a1d764776c3177f92c9ee3d3a1c074c314d2af30bd7',
                        '0x00b2a24fd759c4093935c5268b5cc187b9b15bf287230439453e65e67191902e'
                    ],
                    secretHashes: [
                        '0x2048b38093dc53876b2bbd230ee8999791153db01de425112f449d018094e116',
                        '0x7972c1498893bb9b88baddc9decb78d8defdcc7a182a72edd8724498c75f088d',
                        '0x6d5b8f0b1f8a28564ff65e5f9c4d8a8a6babfb318bca6ecc9d872a3abe8a4ea0'
                    ]
                },
                availableEvents: availableEventsTypes
            }

            const message2: OrderInvalidEvent = {
                type: 'order_invalid',
                data: {
                    orderHash:
                        '0x1beee023ab933cf5446c298eaddb61c0-5705f2156ef5b2db36c160b36f31ce4'
                },
                availableEvents: availableEventsTypes
            }

            const messages = [message2, message1, message1]
            const expectedMessages = [message1, message1]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrderCreated((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 2) {
                    expect(resArray).toEqual(expectedMessages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })

        it('can subscribe to order invalid events', (done) => {
            const message1: OrderCreatedEvent = {
                type: 'order_created',
                data: {
                    quoteId: 'b77da8b7-a4bb-4563-b917-03522aa609e3',
                    orderHash:
                        '0xb9522c23c8667c5e76bf0b855ffabbaebca282f8e396d788c2df75e91a0391d2-5705f2156ef5b2db36c160b36f31ce4',
                    order: {
                        salt: '9445680545936410419330284706951757224702878670220689583677680607556412140293',
                        maker: '0x6edc317f3208b10c46f4ff97faa04dd632487408',
                        receiver: '0x0000000000000000000000000000000000000000',
                        makerAsset:
                            '0x6b175474e89094c44da98b954eedeac495271d0f',
                        takerAsset:
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        makerTraits:
                            '62419173104490761595518734106557662061518414611782227068396304425790442831872',
                        makingAmount: '30000000000000000000',
                        takingAmount: '7516665910385115'
                    },
                    signature:
                        '0xb51731d6e62754ae75d11d13983c19b25fcc1a43fc327710a26ae291fde3d33f52dee7a4c0154256f6bb272260170128242034a89f44e7e887d1bb54a746a5941b',
                    extension:
                        '0x000000cb0000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b840662fb9efb09498030ae3416b66dc00007bf29735c20c566e5a0c0000950fa635aec75b30781a0000d18bd45f0b94f54a968f000076d49414ad2b8371a4220000a59ca88d5813e693528f000038700d5181a674fdb9a2000038',
                    srcChainId: NetworkEnum.ETHEREUM,
                    dstChainId: NetworkEnum.BINANCE,
                    isMakerContract: false,
                    merkleLeaves: [
                        '0x71ad135b040d726eb59a9f718db4d9c9ab93eee0aa072a92569f24ac2f4e314a',
                        '0xfe9789f805bd764824c94a1d764776c3177f92c9ee3d3a1c074c314d2af30bd7',
                        '0x00b2a24fd759c4093935c5268b5cc187b9b15bf287230439453e65e67191902e'
                    ],
                    secretHashes: [
                        '0x2048b38093dc53876b2bbd230ee8999791153db01de425112f449d018094e116',
                        '0x7972c1498893bb9b88baddc9decb78d8defdcc7a182a72edd8724498c75f088d',
                        '0x6d5b8f0b1f8a28564ff65e5f9c4d8a8a6babfb318bca6ecc9d872a3abe8a4ea0'
                    ]
                },
                availableEvents: availableEventsTypes
            }

            const message2: OrderInvalidEvent = {
                type: 'order_invalid',
                data: {
                    orderHash:
                        '0x1beee023ab933cf5446c298eaddb61c0-5705f2156ef5b2db36c160b36f31ce4'
                },
                availableEvents: availableEventsTypes
            }

            const messages = [message1, message1, message2]
            const expectedMessages = [message2]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrderInvalid((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 1) {
                    expect(resArray).toEqual(expectedMessages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })

        it('can subscribe to order_balance_or_allowance_change events', (done) => {
            const message1: OrderCreatedEvent = {
                type: 'order_created',
                data: {
                    quoteId: 'b77da8b7-a4bb-4563-b917-03522aa609e3',
                    orderHash:
                        '0xb9522c23c8667c5e76bf0b855ffabbaebca282f8e396d788c2df75e91a0391d2-5705f2156ef5b2db36c160b36f31ce4',
                    order: {
                        salt: '9445680545936410419330284706951757224702878670220689583677680607556412140293',
                        maker: '0x6edc317f3208b10c46f4ff97faa04dd632487408',
                        receiver: '0x0000000000000000000000000000000000000000',
                        makerAsset:
                            '0x6b175474e89094c44da98b954eedeac495271d0f',
                        takerAsset:
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        makerTraits:
                            '62419173104490761595518734106557662061518414611782227068396304425790442831872',
                        makingAmount: '30000000000000000000',
                        takingAmount: '7516665910385115'
                    },
                    signature:
                        '0xb51731d6e62754ae75d11d13983c19b25fcc1a43fc327710a26ae291fde3d33f52dee7a4c0154256f6bb272260170128242034a89f44e7e887d1bb54a746a5941b',
                    extension:
                        '0x000000cb0000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b840662fb9efb09498030ae3416b66dc00007bf29735c20c566e5a0c0000950fa635aec75b30781a0000d18bd45f0b94f54a968f000076d49414ad2b8371a4220000a59ca88d5813e693528f000038700d5181a674fdb9a2000038',
                    srcChainId: NetworkEnum.ETHEREUM,
                    dstChainId: NetworkEnum.ETHEREUM,
                    isMakerContract: false,
                    merkleLeaves: [],
                    secretHashes: []
                },
                availableEvents: availableEventsTypes
            }

            const message2: OrderBalanceOrAllowanceChangeEvent = {
                type: 'order_balance_or_allowance_change',
                data: {
                    orderHash:
                        '0x1beee023ab933cf5446c298eaddb61c0-5705f2156ef5b2db36c160b36f31ce4',
                    remainingMakerAmount: '57684207067582695',
                    balance: '57684207067582695',
                    allowance: '0'
                },
                availableEvents: availableEventsTypes
            }

            const messages = [message1, message1, message2]
            const expectedMessages = [message2]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrderBalanceOrAllowanceChange((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 1) {
                    expect(resArray).toEqual(expectedMessages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })

        it('can subscribe to order filled events', (done) => {
            const message1: OrderCreatedEvent = {
                type: 'order_created',
                data: {
                    quoteId: 'b77da8b7-a4bb-4563-b917-03522aa609e3',
                    orderHash:
                        '0xb9522c23c8667c5e76bf0b855ffabbaebca282f8e396d788c2df75e91a0391d2-5705f2156ef5b2db36c160b36f31ce4',
                    order: {
                        salt: '9445680545936410419330284706951757224702878670220689583677680607556412140293',
                        maker: '0x6edc317f3208b10c46f4ff97faa04dd632487408',
                        receiver: '0x0000000000000000000000000000000000000000',
                        makerAsset:
                            '0x6b175474e89094c44da98b954eedeac495271d0f',
                        takerAsset:
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        makerTraits:
                            '62419173104490761595518734106557662061518414611782227068396304425790442831872',
                        makingAmount: '30000000000000000000',
                        takingAmount: '7516665910385115'
                    },
                    signature:
                        '0xb51731d6e62754ae75d11d13983c19b25fcc1a43fc327710a26ae291fde3d33f52dee7a4c0154256f6bb272260170128242034a89f44e7e887d1bb54a746a5941b',
                    extension:
                        '0x000000cb0000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b840662fb9efb09498030ae3416b66dc00007bf29735c20c566e5a0c0000950fa635aec75b30781a0000d18bd45f0b94f54a968f000076d49414ad2b8371a4220000a59ca88d5813e693528f000038700d5181a674fdb9a2000038',
                    srcChainId: NetworkEnum.BINANCE,
                    dstChainId: NetworkEnum.ARBITRUM,
                    isMakerContract: false,
                    merkleLeaves: [
                        '0x71ad135b040d726eb59a9f718db4d9c9ab93eee0aa072a92569f24ac2f4e314a',
                        '0xfe9789f805bd764824c94a1d764776c3177f92c9ee3d3a1c074c314d2af30bd7',
                        '0x00b2a24fd759c4093935c5268b5cc187b9b15bf287230439453e65e67191902e'
                    ],
                    secretHashes: [
                        '0x2048b38093dc53876b2bbd230ee8999791153db01de425112f449d018094e116',
                        '0x7972c1498893bb9b88baddc9decb78d8defdcc7a182a72edd8724498c75f088d',
                        '0x6d5b8f0b1f8a28564ff65e5f9c4d8a8a6babfb318bca6ecc9d872a3abe8a4ea0'
                    ]
                },
                availableEvents: availableEventsTypes
            }

            const message2: OrderFilledEvent = {
                type: 'order_filled',
                data: {
                    orderHash:
                        '0x1beee023ab933cf5446c298eaddb61c0-5705f2156ef5b2db36c160b36f31ce4'
                },
                availableEvents: availableEventsTypes
            }

            const messages = [message1, message1, message2]
            const expectedMessages = [message2]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrderFilled((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 1) {
                    expect(resArray).toEqual(expectedMessages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })

        it('can subscribe to order filled partially events', (done) => {
            const message1: OrderCreatedEvent = {
                type: 'order_created',
                data: {
                    quoteId: 'b77da8b7-a4bb-4563-b917-03522aa609e3',
                    orderHash:
                        '0xb9522c23c8667c5e76bf0b855ffabbaebca282f8e396d788c2df75e91a0391d2-5705f2156ef5b2db36c160b36f31ce4',
                    order: {
                        salt: '9445680545936410419330284706951757224702878670220689583677680607556412140293',
                        maker: '0x6edc317f3208b10c46f4ff97faa04dd632487408',
                        receiver: '0x0000000000000000000000000000000000000000',
                        makerAsset:
                            '0x6b175474e89094c44da98b954eedeac495271d0f',
                        takerAsset:
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        makerTraits:
                            '62419173104490761595518734106557662061518414611782227068396304425790442831872',
                        makingAmount: '30000000000000000000',
                        takingAmount: '7516665910385115'
                    },
                    signature:
                        '0xb51731d6e62754ae75d11d13983c19b25fcc1a43fc327710a26ae291fde3d33f52dee7a4c0154256f6bb272260170128242034a89f44e7e887d1bb54a746a5941b',
                    extension:
                        '0x000000cb0000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b840662fb9efb09498030ae3416b66dc00007bf29735c20c566e5a0c0000950fa635aec75b30781a0000d18bd45f0b94f54a968f000076d49414ad2b8371a4220000a59ca88d5813e693528f000038700d5181a674fdb9a2000038',
                    srcChainId: NetworkEnum.ARBITRUM,
                    dstChainId: NetworkEnum.ETHEREUM,
                    isMakerContract: false,
                    merkleLeaves: [
                        '0x71ad135b040d726eb59a9f718db4d9c9ab93eee0aa072a92569f24ac2f4e314a',
                        '0xfe9789f805bd764824c94a1d764776c3177f92c9ee3d3a1c074c314d2af30bd7',
                        '0x00b2a24fd759c4093935c5268b5cc187b9b15bf287230439453e65e67191902e'
                    ],
                    secretHashes: [
                        '0x2048b38093dc53876b2bbd230ee8999791153db01de425112f449d018094e116',
                        '0x7972c1498893bb9b88baddc9decb78d8defdcc7a182a72edd8724498c75f088d',
                        '0x6d5b8f0b1f8a28564ff65e5f9c4d8a8a6babfb318bca6ecc9d872a3abe8a4ea0'
                    ]
                },
                availableEvents: availableEventsTypes
            }

            const message2: OrderFilledPartiallyEvent = {
                type: 'order_filled_partially',
                data: {
                    orderHash:
                        '0x1beee023ab933cf5446c298eaddb61c0-5705f2156ef5b2db36c160b36f31ce4',
                    remainingMakerAmount: '57684207067582695'
                },
                availableEvents: availableEventsTypes
            }

            const messages = [message1, message1, message2]
            const expectedMessages = [message2]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrderFilledPartially((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 1) {
                    expect(resArray).toEqual(expectedMessages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })

        it('can subscribe to order cancelled events', (done) => {
            const message1: OrderCreatedEvent = {
                type: 'order_created',
                data: {
                    srcChainId: 1,
                    dstChainId: 56,
                    orderHash:
                        '0xb9522c23c8667c5e76bf0b855ffabbaebca282f8e396d788c2df75e91a0391d2-5705f2156ef5b2db36c160b36f31ce4',
                    order: {
                        salt: '9445680545936410419330284706951757224702878670220689583677680607556412140293',
                        maker: '0x6edc317f3208b10c46f4ff97faa04dd632487408',
                        receiver: '0x0000000000000000000000000000000000000000',
                        makerAsset:
                            '0x6b175474e89094c44da98b954eedeac495271d0f',
                        takerAsset:
                            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                        makerTraits:
                            '62419173104490761595518734106557662061518414611782227068396304425790442831872',
                        makingAmount: '30000000000000000000',
                        takingAmount: '7516665910385115'
                    },
                    extension:
                        '0x000000cb0000005e0000005e0000005e0000005e0000002f0000000000000000fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b84000000000000000662fba0700025829a7fd01ec57001827bba60018fb2809a5314473e1165f6b58018e20ed8f07b840662fb9efb09498030ae3416b66dc00007bf29735c20c566e5a0c0000950fa635aec75b30781a0000d18bd45f0b94f54a968f000076d49414ad2b8371a4220000a59ca88d5813e693528f000038700d5181a674fdb9a2000038',

                    signature:
                        '0xb51731d6e62754ae75d11d13983c19b25fcc1a43fc327710a26ae291fde3d33f52dee7a4c0154256f6bb272260170128242034a89f44e7e887d1bb54a746a5941b',

                    isMakerContract: true,
                    quoteId: 'b77da8b7-a4bb-4563-b917-03522aa609e3',
                    merkleLeaves: [
                        '0x71ad135b040d726eb59a9f718db4d9c9ab93eee0aa072a92569f24ac2f4e314a',
                        '0xfe9789f805bd764824c94a1d764776c3177f92c9ee3d3a1c074c314d2af30bd7',
                        '0x00b2a24fd759c4093935c5268b5cc187b9b15bf287230439453e65e67191902e'
                    ],
                    secretHashes: [
                        '0x2048b38093dc53876b2bbd230ee8999791153db01de425112f449d018094e116',
                        '0x7972c1498893bb9b88baddc9decb78d8defdcc7a182a72edd8724498c75f088d',
                        '0x6d5b8f0b1f8a28564ff65e5f9c4d8a8a6babfb318bca6ecc9d872a3abe8a4ea0'
                    ]
                },
                availableEvents: availableEventsTypes
            }

            const message2: OrderCancelledEvent = {
                type: 'order_cancelled',
                data: {
                    orderHash:
                        '0x1beee023ab933cf5446c298eaddb61c0-5705f2156ef5b2db36c160b36f31ce4',
                    remainingMakerAmount: '30000000000000000000'
                },
                availableEvents: availableEventsTypes
            }

            const messages = [message1, message1, message2]
            const expectedMessages = [message2]
            const {url, wss} = createWebsocketServerMock(messages)

            const wsSdk = new WebSocketApi({
                url,
                network: NetworkEnum.ETHEREUM,
                authKey: ''
            })

            const resArray: OrderEventType[] = []
            wsSdk.order.onOrderCancelled((data) => {
                resArray.push(data)
            })

            wsSdk.onMessage(() => {
                if (resArray.length === 1) {
                    expect(resArray).toEqual(expectedMessages)
                    wsSdk.close()
                    wss.close()
                    done()
                }
            })
        })
    })
})

function createWebsocketRpcServerMock(cb: (ws: WebSocket, data: any) => void): {
    url: string
    wss: WebSocketServer
} {
    const port = 8080
    const returnUrl = `ws://localhost:${port}/ws`
    const wss = new WebSocketServer({port, path: '/ws/v2.0/1'})

    wss.on('connection', (ws: WebSocket) => {
        ws.on('message', (data) => cb(ws, data))
    })

    return {url: returnUrl, wss}
}

function createWebsocketServerMock(messages: any[]): {
    url: string
    wss: WebSocketServer
} {
    const port = 8080

    const returnUrl = `ws://localhost:${port}/ws`
    const wss = new WebSocketServer({port, path: '/ws/v2.0/1'})

    wss.on('connection', (ws: WebSocket) => {
        for (const message of messages) {
            ws.send(JSON.stringify(message))
        }
    })

    return {url: returnUrl, wss}
}
