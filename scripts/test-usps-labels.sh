#!/bin/bash
# Test USPS Labels API access with existing credentials

CLIENT_ID="TCAlm8hBAuLgUDfFz9qC0zbtNQLtBaXpdqPeVgHqTGUYX9t9"
CLIENT_SECRET="iDc6qVzqJjAFEBhA1iTkA1QbhTXG9LnQ6oSrJjqnsu4lIBoS3R4u0XVy1GHP0aV6"

echo "=== Step 1: Get OAuth token ==="
TOKEN_RESPONSE=$(curl -s -X POST "https://api.usps.com/oauth2/v3/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}")

echo "$TOKEN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TOKEN_RESPONSE"

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Could not get access token"
  exit 1
fi

echo ""
echo "=== Step 2: Test Labels endpoint ==="
# Minimal label request to see if we get an auth error vs a validation error
# A validation error means we HAVE access, just bad data
# A 403/401 means we don't have label permissions

LABEL_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "https://api.usps.com/labels/v3/label" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "imageInfo": {
      "imageType": "PDF",
      "labelType": "4X6LABEL"
    },
    "toAddress": {
      "firstName": "Test",
      "lastName": "User",
      "streetAddress": "1600 Pennsylvania Ave NW",
      "city": "Washington",
      "state": "DC",
      "ZIPCode": "20500"
    },
    "fromAddress": {
      "firstName": "Crystal Harbor",
      "lastName": "Trading",
      "streetAddress": "123 Main St",
      "city": "Indianapolis",
      "state": "IN",
      "ZIPCode": "46201"
    },
    "packageDescription": {
      "weight": 1.0,
      "length": 10,
      "width": 8,
      "height": 4,
      "mailClass": "PRIORITY_MAIL",
      "rateIndicator": "DR",
      "processingCategory": "MACHINABLE"
    }
  }')

HTTP_CODE=$(echo "$LABEL_RESPONSE" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
BODY=$(echo "$LABEL_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_CODE"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

echo ""
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  echo "❌ NO ACCESS — Labels API not enabled on these credentials"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ LABELS API IS ACTIVE — got a successful response!"
else
  echo "⚠️  Got HTTP $HTTP_CODE — likely have access but request needs adjustment (validation error = good sign)"
fi
