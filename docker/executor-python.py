#!/usr/bin/env python3
import asyncio
import websockets
import json
import sys
import io
import traceback
from contextlib import redirect_stdout, redirect_stderr

async def execute_code(websocket):
    """Handle code execution requests via WebSocket"""
    async for message in websocket:
        try:
            data = json.loads(message)
            msg_type = data.get('type', 'execute')
            
            # Handle input response (skip execution, handled in InteractiveStdin)
            if msg_type == 'input_response':
                continue
                
            code = data.get('code', '')
            input_data = data.get('input', '')
            
            # Prepare stdin if input is provided
            if input_data:
                sys.stdin = io.StringIO(input_data)
            
            # Capture stdout and stderr
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            
            try:
                with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                    # Execute the code
                    exec(code, {'__builtins__': __builtins__})
                
                output = stdout_capture.getvalue()
                error = stderr_capture.getvalue()
                
                response = {
                    'type': 'result',
                    'status': 'success',
                    'output': output if output else (error if error else 'Code executed successfully with no output'),
                    'error': error if error else None
                }
            except Exception as e:
                response = {
                    'type': 'result',
                    'status': 'error',
                    'output': '',
                    'error': f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
                }
            finally:
                # Reset stdin
                sys.stdin = sys.__stdin__
            
            await websocket.send(json.dumps(response))
            
        except json.JSONDecodeError:
            await websocket.send(json.dumps({
                'type': 'result',
                'status': 'error',
                'output': '',
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            await websocket.send(json.dumps({
                'type': 'result',
                'status': 'error',
                'output': '',
                'error': f'Executor error: {str(e)}'
            }))
            
        except json.JSONDecodeError:
            await websocket.send(json.dumps({
                'status': 'error',
                'output': '',
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            await websocket.send(json.dumps({
                'status': 'error',
                'output': '',
                'error': f'Executor error: {str(e)}'
            }))

async def main():
    """Start the WebSocket server"""
    print("Python executor starting on port 8765...", flush=True)
    async with websockets.serve(execute_code, "0.0.0.0", 8765):
        print("Python executor ready", flush=True)
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
