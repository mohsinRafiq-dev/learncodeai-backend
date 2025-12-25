#!/usr/bin/env python3
import asyncio
import websockets
import json
import subprocess
import os
import tempfile
import traceback

async def execute_code(websocket):
    """Handle C++ code execution requests via WebSocket"""
    async for message in websocket:
        try:
            data = json.loads(message)
            code = data.get('code', '')
            input_data = data.get('input', '')
            
            # Create temporary files for code and input
            with tempfile.TemporaryDirectory() as tmpdir:
                cpp_file = os.path.join(tmpdir, 'main.cpp')
                exe_file = os.path.join(tmpdir, 'main')
                
                # Write code to file
                with open(cpp_file, 'w') as f:
                    f.write(code)
                
                # Compile the code
                compile_process = subprocess.run(
                    ['g++', '-o', exe_file, cpp_file],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if compile_process.returncode != 0:
                    response = {
                        'status': 'error',
                        'output': '',
                        'error': f'Compilation error:\n{compile_process.stderr}'
                    }
                    await websocket.send(json.dumps(response))
                    continue
                
                # Run the compiled program
                try:
                    run_process = subprocess.run(
                        [exe_file],
                        input=input_data,
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    
                    output = run_process.stdout
                    error = run_process.stderr
                    
                    response = {
                        'status': 'success' if run_process.returncode == 0 else 'error',
                        'output': output if output else (error if error else 'Code executed successfully with no output'),
                        'error': error if run_process.returncode != 0 else None
                    }
                    
                except subprocess.TimeoutExpired:
                    response = {
                        'status': 'error',
                        'output': '',
                        'error': 'Execution timeout (10 seconds). Your code may have an infinite loop.'
                    }
                except Exception as e:
                    response = {
                        'status': 'error',
                        'output': '',
                        'error': f'Runtime error: {str(e)}'
                    }
                
                await websocket.send(json.dumps(response))
                
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
                'error': f'Executor error: {str(e)}\n{traceback.format_exc()}'
            }))

async def main():
    """Start the WebSocket server"""
    print("C++ executor starting on port 8765...", flush=True)
    async with websockets.serve(execute_code, "0.0.0.0", 8765):
        print("C++ executor ready", flush=True)
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
