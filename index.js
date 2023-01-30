import { createServer } from 'http'
import { Server } from 'socket.io'

export default function (options = {}) {
    const { port, server = createServer(), token, logger = console } = options
    const io = options.io || new Server(server, {})
    let triggerUri

    const mikserNamespace = io.of('/mikser')
    mikserNamespace.use((socket, next) => {
        if (!token) return next()
        if (socket.handshake.query.token != token) {
            next(new Error('Authorization token is missing or invalid.'))
        }
    })
    mikserNamespace.on('connection', (socket) => {
        if (triggerUri) {
            logger.info('Mikser socket trigger: %s', triggerUri)
            socket.emit('trigger', { uri: triggerUri })
        }
    })

    if (options.port && !options.server) {
        server.listen(port)
    }
    logger.info('Mikser socket initalized')

    return {
        async trigger(uri) {
            triggerUri = uri
        },
        async created(name, entity) {
            logger.info('Mikser socket created: %s %s', name, entity.id)
            mikserNamespace.emit('created', { name, entity })
        },
        async updated(name, entity) {
            logger.info('Mikser socket updated: %s %s', name, entity.id)
            mikserNamespace.emit('updated', { name, entity })
        },
        async deleted(name, entity) {
            logger.info('Mikser socket deleted: %s %s', name, entity.id)
            mikserNamespace.emit('updated', { name, entity })
        },
    }
}