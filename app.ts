import { createServer, connect, AddressInfo } from "net"
import { createInterface } from "readline"
import { writeFile, readdir, stat, createReadStream, readFile, unlink } from "fs"

var interf = createInterface(process.stdin, process.stdout)

interf.question("Listen or transmit (l/t): ", answer=>{
    if (answer == "l") {
        var server = createServer(socket=>{
            console.log(`Connection from ${(socket.address() as AddressInfo).address}`)
            socket.on("close", ()=>{
                console.log(`Connection lost from ${(socket.address() as AddressInfo).address}`)
            })

            socket.on("data", data=>{
                var name = data.slice(0, data.indexOf(0)).toString()
                var content = data.subarray(255)
                console.log(`Recived file ${name}`)
                writeFile(name, content, err=>{
                    if (err) console.error(err.name)
                })
            })

            socket.on("error", (err)=>{
                if ((err as any).code != "ECONNRESET") throw err
            })
        })

        server.listen(9456)
        interf.close()
    } else if (answer == "t") {
         interf.question("IP adress: ", ipAddress=>{
            var socket = connect(9456, ipAddress, ()=>{
                setInterval(()=>{
                    readdir(".", (err, files)=>{
                        if (err) throw err
                        files.forEach(v=>{
                            readFile(v, (err, data)=>{
                                if (err) console.log(err.name)
                                var toSend = new Buffer(data.length + 255)
                                toSend.slice(0, 255).write(v)
                                data.copy(toSend, 255)
                                socket.write(toSend, (err)=>{
                                    if (err) throw err
                                    console.log(`Sent file ${v}`)
                                    unlink(v, (err)=>{
                                        if (err) throw err
                                    })
                                })
                            })
                        })
                    })
                }, 1000)
            })
            interf.close()
         })
    } else {
        throw new Error("Invalid option")
    }
})