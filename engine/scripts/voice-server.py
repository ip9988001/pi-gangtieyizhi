#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Voice Chat Server for XinXin
Usage: python voice-server.py
Access: http://localhost:8080
"""

import http.server
import socketserver
import os
import sys

# Set encoding
sys.stdout.reconfigure(encoding='utf-8')

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("[VOICE] Server started")
        print("[VOICE] Open: http://localhost:8080/voice-chat.html")
        print("[VOICE] Press Ctrl+C to stop")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[VOICE] Server stopped")

if __name__ == "__main__":
    main()
