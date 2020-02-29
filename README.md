# TCPFileMover
Simple automatic file mover for node.js using websockets.
## Usage
### Listening mode
The app will listen for incoming files.
### Transmit mode
After connecting to a listening app, it will send all files in the cwd, then delete them. It will periodically (1s) scan the cwd for more files.
