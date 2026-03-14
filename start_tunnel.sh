#!/bin/bash
echo "🚀 Starting Ngrok Tunnel on port 8000 using npx..."
echo "Copy the 'Forwarding' URL below (starts with https://) and set it as VITE_API_URL in Vercel settings."
echo "----------------------------------------------------------------"
npx -y ngrok http 8000
