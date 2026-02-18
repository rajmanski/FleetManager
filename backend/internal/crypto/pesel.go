package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"fmt"
	"log"
)

const maskedPESEL = "***"

// encrypts PESEL with AES-256-GCM. Returns base64-encoded ciphertext.
func EncryptPESEL(pesel string, key []byte) (string, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("aes.NewCipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("cipher.NewGCM: %w", err)
	}
	nonce := make([]byte, gcm.NonceSize())
	ciphertext := gcm.Seal(nonce, nonce, []byte(pesel), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decrypts base64-encoded ciphertext. On error returns masked value and logs.
func DecryptPESEL(encrypted string, key []byte) (string, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil {
		log.Printf("[crypto] DecryptPESEL decode error: %v", err)
		return maskedPESEL, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		log.Printf("[crypto] DecryptPESEL cipher error: %v", err)
		return maskedPESEL, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		log.Printf("[crypto] DecryptPESEL GCM error: %v", err)
		return maskedPESEL, err
	}
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		log.Printf("[crypto] DecryptPESEL: ciphertext too short")
		return maskedPESEL, fmt.Errorf("ciphertext too short")
	}
	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		log.Printf("[crypto] DecryptPESEL Open error: %v", err)
		return maskedPESEL, err
	}
	return string(plaintext), nil
}
