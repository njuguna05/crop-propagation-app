#!/usr/bin/env python3
"""
Simple script to start the FastAPI server
"""
import subprocess
import sys
import os

# Change to backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Start the server
try:
    subprocess.run([
        sys.executable, "-c",
        """
import uvicorn

# Simple main app without complex dependencies
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(
    title="Crop Propagation API",
    description="FastAPI backend for crop propagation management",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple test endpoints
@app.get("/")
async def root():
    return {"message": "Crop Propagation API", "status": "running", "timestamp": datetime.now()}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now()}

# Simple auth endpoint
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/v1/auth/login")
async def login(credentials: LoginRequest):
    # Simple mock authentication
    if credentials.username == "admin" and credentials.password == "admin":
        return {
            "access_token": "mock-jwt-token",
            "refresh_token": "mock-refresh-token",
            "token_type": "bearer",
            "user": {
                "id": 1,
                "username": "admin",
                "email": "admin@example.com"
            }
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/v1/auth/me")
async def get_current_user():
    return {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "Administrator"
    }

# Mock endpoints for basic functionality
@app.get("/api/v1/crops")
async def get_crops():
    return []

@app.get("/api/v1/tasks")
async def get_tasks():
    return []

@app.get("/api/v1/orders")
async def get_orders():
    return []

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
        """
    ], check=True)
except KeyboardInterrupt:
    print("\\nServer stopped")
except Exception as e:
    print(f"Error starting server: {e}")
    sys.exit(1)