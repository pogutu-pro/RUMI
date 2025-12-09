#!/usr/bin/env python
"""
Test script for chat system endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

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

def test_conversations_list(token):
    """Test getting user's conversations"""
    url = f"{BASE_URL}/accounts/chat/conversations/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers)
    print(f"\nConversations List - Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total conversations: {data['total']}")
        for conv in data['conversations']:
            print(f"- Conversation ID: {conv['id']}, Other participant: {conv.get('other_participant', {}).get('first_name', 'Unknown')}")
    else:
        print(f"Error: {response.text}")

def test_conversation_messages(token, conversation_id):
    """Test getting messages for a conversation"""
    url = f"{BASE_URL}/accounts/chat/conversations/{conversation_id}/messages/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers)
    print(f"\nConversation Messages - Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total messages: {data['total']}")
        for msg in data['messages'][:3]:  # Show first 3 messages
            print(f"- {msg['sender_name']}: {msg['content'][:50]}...")
    else:
        print(f"Error: {response.text}")

def test_send_message(token, recipient_id, message_content):
    """Test sending a message"""
    url = f"{BASE_URL}/accounts/chat/send/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    data = {
        "recipient_id": recipient_id,
        "content": message_content
    }

    response = requests.post(url, headers=headers, json=data)
    print(f"\nSend Message - Status: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"Message sent successfully!")
        print(f"Conversation ID: {data['conversation']['id']}")
        print(f"Message: {data['message_data']['content']}")
    else:
        print(f"Error: {response.text}")

def main():
    # Test user credentials (you may need to adjust these)
    test_users = [
        {"email": "test@example.com", "password": "testpass123"},
        {"email": "student@test.com", "password": "testpass123"},
    ]

    print("Testing Chat System Endpoints")
    print("=" * 40)

    # Test with first user
    user1 = test_users[0]
    print(f"\nLogging in as {user1['email']}")
    token1 = get_token(user1['email'], user1['password'])

    if not token1:
        print("Failed to get token for user 1")
        return

    # Test conversations list
    test_conversations_list(token1)

    # If there are conversations, test messages
    # For now, let's send a message first
    if len(test_users) > 1:
        # Get user2's ID (we'll need to get it from somewhere, for now assume ID 2)
        test_send_message(token1, 2, "Hello from automated test!")

        # Test conversations again to see the new conversation
        test_conversations_list(token1)

        # If we have a conversation, test messages (assuming conversation ID 1)
        test_conversation_messages(token1, 1)

if __name__ == "__main__":
    main()