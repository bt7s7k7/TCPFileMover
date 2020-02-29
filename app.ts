import { createInterface } from "readline"
import { writeFile, readdir, stat, createReadStream, readFile, unlink } from "fs"
import { server as WebSocketServer, client as WebSocketClient } from "websocket"
import { createServer } from "http"
import { AddressInfo } from "net"

var interf = createInterface(process.stdin, process.stdout)

var processingFiles = [] as string[]

interf.question("Listen or transmit (l/t): ", answer => {
    if (answer == "l") {

        let server = createServer((req, res) => {
            res.end("TCPFileMover port")
        })

        server.listen(9456, () => {

        })

        var wsServer = new WebSocketServer({
            httpServer: server,
            maxReceivedMessageSize: 50 * 1024 * 1024
        })

        wsServer.on("request", request => {
            if (request.requestedProtocols.indexOf("tcp-file-mover") == -1) request.reject()
            var connection = request.accept('tcp-file-mover', request.origin)
            console.log(`Connection from ${(request.socket.address() as AddressInfo).address}`)
            connection.on('message', function (message) {
                var data = message.binaryData
                var name = data.slice(0, data.indexOf(0)).toString()
                var content = data.subarray(255)
                console.log(`Recived file ${name}`)
                writeFile(name, content, err => {
                    if (err) console.error(err.name)
                })
            })
            connection.on('close', function (reasonCode, description) {
                console.log(`Connection lost from ${(request.socket.address() as AddressInfo).address}`)
            })
        })

        interf.close()
    } else if (answer == "t") {
        interf.question("IP adress: ", ipAddress => {

            var client = new WebSocketClient({
            })

            client.on("connect", connection => {
                console.log(`Connected to ${(connection.socket.address() as AddressInfo).address}`)

                setInterval(() => {
                    readdir(".", (err, files) => {
                        if (err) throw err
                        files.forEach(v => {
                            if (processingFiles.indexOf(v) == -1) processingFiles.push(v)
                            else return
                            readFile(v, (err, data) => {
                                if (err) return
                                var toSend = Buffer.alloc(data.length + 255)
                                toSend.slice(0, 255).write(v)
                                data.copy(toSend, 255)
                                connection.send(toSend, (err) => {
                                    if (err) throw err
                                    console.log(`Sent file ${v}`)
                                    unlink(v, (err) => {
                                        if (err) console.error(err.message)
                                        var index = processingFiles.indexOf(v)
                                        if (index != -1) processingFiles.splice(index, 1)
                                    })
                                })
                            })
                        })
                    })
                }, 1000)
            })

            client.connect(`ws://${ipAddress}:9456/`, "tcp-file-mover")

            interf.close()
        })
    } else {
        throw new Error("Invalid option")
    }
})