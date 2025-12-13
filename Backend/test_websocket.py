#!/usr/bin/env python
"""
Test script for WebSocket chat functionality
"""
import asyncio
import websockets
import json
import requests

BASE_URL = "http://localhost:8000/api/v1"
WS_BASE_URL = "ws://localhost:8000"

def get_token(email, password):
    """Get authentication token"""
    url = f"{BASE_URL}/accounts/login/"
    data = {
        "email": email,
        "password": password
    }

    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        print(f"Login failed: {response.text}")
        return None

async def chat_client(token, conversation_id):
    """WebSocket chat client"""
    uri = f"{WS_BASE_URL}/ws/chat/{conversation_id}/"

    # Add authorization header
    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        async with websockets.connect(uri, extra_headers=headers) as websocket:
            print(f"Connected to conversation {conversation_id}")

            # Send a test message
            message_data = {
                "type": "send_message",
                "content": "Hello from WebSocket test!"
            }
            await websocket.send(json.dumps(message_data))
            print("Sent message via WebSocket")

            # Listen for responses
            try:
                async for message in websocket:
                    data = json.loads(message)
                    print(f"Received: {data}")

                    # Send typing indicator
                    if data.get('type') == 'new_message':
                        typing_data = {"type": "typing_start"}
                        await websocket.send(json.dumps(typing_data))

                        # Stop typing after 2 seconds
                        await asyncio.sleep(2)
                        typing_stop = {"type": "typing_stop"}
                        await websocket.send(json.dumps(typing_stop))

                        # Mark as read
                        read_data = {"type": "mark_read"}
                        await websocket.send(json.dumps(read_data))

                        break

            except websockets.exceptions.ConnectionClosed:
                print("Connection closed")

    except Exception as e:
        print(f"WebSocket connection failed: {e}")

async def notification_client(token):
    """WebSocket notification client"""
    uri = f"{WS_BASE_URL}/ws/notifications/"

    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        async with websockets.connect(uri, extra_headers=headers) as websocket:
            print("Connected to notifications")

            # Listen for notifications
            try:
                async for message in websocket:
                    data = json.loads(message)
                    print(f"Notification: {data}")
            except websockets.exceptions.ConnectionClosed:
                print("Notification connection closed")

    except Exception as e:
        print(f"Notification WebSocket connection failed: {e}")

async def main():
    # Test user credentials
    test_users = [
        {"email": "test@example.com", "password": "testpass123"},
        {"email": "student@test.com", "password": "testpass123"},
    ]

    print("Testing WebSocket Chat Functionality")
    print("=" * 40)

    # Get tokens for both users
    tokens = []
    for user in test_users:
        token = get_token(user['email'], user['password'])
        if token:
            tokens.append(token)
            print(f"Got token for {user['email']}")
        else:
            print(f"Failed to get token for {user['email']}")
            return

    if len(tokens) < 2:
        print("Need at least 2 users for chat test")
        return

    # Create a conversation between users
    print("\nCreating conversation...")
    url = f"{BASE_URL}/accounts/chat/send/"
    headers = {
        "Authorization": f"Bearer {tokens[0]}",
        "Content-Type": "application/json"
    }

    # Assuming user 2 has ID 2 (you may need to adjust this)
    data = {
        "recipient_id": 2,
        "content": "Starting WebSocket test conversation"
    }

    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 201:
        conversation_data = response.json()
        conversation_id = conversation_data['conversation']['id']
        print(f"Created conversation {conversation_id}")
    else:
        print(f"Failed to create conversation: {response.text}")
        return

    # Test WebSocket chat
    print(f"\nTesting WebSocket chat for conversation {conversation_id}...")

    # Run both clients concurrently
    await asyncio.gather(
        chat_client(tokens[0], conversation_id),
        notification_client(tokens[1])
    )

if __name__ == "__main__":
    print("WebSocket Test Instructions:")
    print("1. Make sure Django server is running with ASGI: daphne rumi.asgi:application")
    print("2. Make sure Redis is running for channel layers")
    print("3. Run this script: python test_websocket.py")
    print()

    asyncio.run(main())