const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');

const wss = new WebSocketServer({ port: 8765, host: '0.0.0.0' });

console.log('JavaScript executor starting on port 8765...');

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            const code = data.code || '';
            const input = data.input || '';

            // Create a temporary process to execute the code
            const nodeProcess = spawn('node', ['-e', code], {
                timeout: 10000,
                maxBuffer: 1024 * 1024
            });

            let output = '';
            let errorOutput = '';

            // If input is provided, write it to stdin
            if (input) {
                nodeProcess.stdin.write(input);
                nodeProcess.stdin.end();
            }

            nodeProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            nodeProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            nodeProcess.on('close', (code) => {
                const response = {
                    status: code === 0 ? 'success' : 'error',
                    output: output || errorOutput || 'Code executed successfully with no output',
                    error: code !== 0 ? errorOutput : null
                };
                ws.send(JSON.stringify(response));
            });

            nodeProcess.on('error', (error) => {
                ws.send(JSON.stringify({
                    status: 'error',
                    output: '',
                    error: `Execution error: ${error.message}`
                }));
            });

        } catch (error) {
            ws.send(JSON.stringify({
                status: 'error',
                output: '',
                error: `Executor error: ${error.message}`
            }));
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log('JavaScript executor ready');
