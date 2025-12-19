#!/bin/bash

# Generate RSA key pair for JWT signing
# Run this script to generate keys for development

set -e

KEYS_DIR="./keys"
mkdir -p "$KEYS_DIR"

echo "Generating RSA key pair for JWT signing..."

# Generate private key
openssl genrsa -out "$KEYS_DIR/private.pem" 2048

# Generate public key from private key
openssl rsa -in "$KEYS_DIR/private.pem" -pubout -out "$KEYS_DIR/public.pem"

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Generate CSRF secret
CSRF_SECRET=$(openssl rand -hex 32)

echo ""
echo "Keys generated successfully!"
echo ""
echo "Private key: $KEYS_DIR/private.pem"
echo "Public key: $KEYS_DIR/public.pem"
echo ""
echo "Add these to your .env file:"
echo ""
echo "ENCRYPTION_KEY=\"$ENCRYPTION_KEY\""
echo "CSRF_SECRET=\"$CSRF_SECRET\""
echo ""
echo "For JWT keys, use these commands to format for .env:"
echo "  JWT_PRIVATE_KEY=\$(cat $KEYS_DIR/private.pem | tr '\\n' '|' | sed 's/|/\\\\n/g')"
echo "  JWT_PUBLIC_KEY=\$(cat $KEYS_DIR/public.pem | tr '\\n' '|' | sed 's/|/\\\\n/g')"
echo ""
echo "WARNING: Never commit the keys directory or .env file to version control!"

