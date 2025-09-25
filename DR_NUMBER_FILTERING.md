# DR Number Filtering Implementation

## Overview

This implementation adds filtering to only allow messages to be processed for tickets that contain valid DR numbers in the format "DR" followed by exactly 7 digits (e.g., DR1748798).

## Changes Made

### 1. MessageController (`backend/src/controllers/MessageController.ts`)

- Added helper functions:
  - `isValidDrNumber(text)`: Validates if text matches DR followed by 7 digits
  - `extractDrNumber(ticket)`: Extracts DR number from contact name, last message, or ticket ID

- Modified `store()` function to:
  - Check for valid DR number before sending messages
  - Return 400 error if no valid DR number is found
  - Log the DR number being processed

### 2. WhatsApp Message Listener (`backend/src/services/WbotServices/wbotMessageListener.ts`)

- Added helper functions:
  - `isValidDrNumber(text)`: Same validation as MessageController
  - `extractDrNumberFromMessage(msg, contact)`: Extracts DR number from contact name or message body

- Modified `handleMessage()` function to:
  - Check for DR number before processing incoming messages
  - Skip processing if no valid DR number is found (for incoming messages only)
  - Log the DR number being processed

## How It Works

### For Outgoing Messages (API)
1. When a message is sent via the API (`POST /messages/:ticketId`)
2. The system extracts the DR number from:
   - Contact name (e.g., "John Doe - DR1748798")
   - Last message in the ticket
   - Ticket ID if formatted as DR number
3. If no valid DR number is found, returns HTTP 400 error
4. If valid DR number is found, message is sent and logged

### For Incoming Messages (WhatsApp)
1. When a message is received via WhatsApp
2. The system extracts the DR number from:
   - Contact name
   - Message body (e.g., "Issue with DR1748798")
3. If no valid DR number is found and message is not from the system, it's rejected
4. If valid DR number is found, message is processed and logged

## DR Number Format

The system accepts DR numbers in the format:
- `DR` followed by exactly 7 digits
- Examples: `DR1748798`, `DR1234567`, `DR9999999`
- Case-sensitive: must be uppercase `DR`

## Error Messages

When no valid DR number is found:
- API returns: `{"error": "Ticket does not contain a valid DR number (DR followed by 7 digits). Example: DR1748798"}`
- Incoming messages are logged as rejected but no error response sent to user

## Logging

The system logs:
- `Processing message for DR number: DR1748798` - When a valid DR number is found
- `Message rejected: No valid DR number found in message from [number]` - When incoming message lacks DR number
- `Message rejected: Ticket [id] does not have a valid DR number` - When ticket lacks DR number

## Testing

The implementation has been compiled successfully with TypeScript, confirming:
- No syntax errors
- Proper type checking
- Correct imports and exports

## Usage Examples

### Valid DR Numbers (will be processed)
- Contact name: "Customer Service - DR1748798"
- Message body: "Please help with DR1748798"
- Last message: "Ticket DR1748798 needs attention"

### Invalid DR Numbers (will be rejected)
- "DR123" (too short)
- "DR12345678" (too long)
- "dr1748798" (lowercase)
- "DRABC1234" (contains letters)