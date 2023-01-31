import { createServer } from 'http'
import { Server } from 'socket.io'

export default function (options = {}) {
    const { port, server = createServer(), token, logger = console } = options

    const mikserNamespace = new Server(server).of('/mikser')
    mikserNamespace.use((socket, next) => {
        if (!token) return next()
        if (socket.handshake.auth?.token != token) {
            return next(new Error('Authorization token is missing or invalid.'))
        }
        next()
    })
    mikserNamespace.on('connection', () => {
        logger.info('Mikser subscription connected')
    })

    if (options.port && !options.server) {
        server.listen(port)
        logger.info('Mikser subscription initalized: %d', port)
    } else {
        logger.info('Mikser subscription initalized')
    }

    return {
        async trigger(uri) {
            triggerUri = uri
            mikserNamespace.emit('trigger', { uri })
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