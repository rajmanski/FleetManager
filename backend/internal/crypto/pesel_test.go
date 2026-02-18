package crypto

import (
	"testing"
)

func TestEncryptDecryptPESEL(t *testing.T) {
	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i)
	}

	pesel := "44051401359"
	encrypted, err := EncryptPESEL(pesel, key)
	if err != nil {
		t.Fatalf("EncryptPESEL: %v", err)
	}
	if encrypted == pesel {
		t.Error("encrypted should differ from plaintext")
	}

	decrypted, err := DecryptPESEL(encrypted, key)
	if err != nil {
		t.Fatalf("DecryptPESEL: %v", err)
	}
	if decrypted != pesel {
		t.Errorf("decrypted = %q, want %q", decrypted, pesel)
	}
}

func TestDecryptPESEL_InvalidBase64(t *testing.T) {
	key := make([]byte, 32)
	got, err := DecryptPESEL("not-valid-base64!!!", key)
	if err == nil {
		t.Error("expected error for invalid base64")
	}
	if got != maskedPESEL {
		t.Errorf("got = %q, want %q", got, maskedPESEL)
	}
}

func TestDecryptPESEL_WrongKey(t *testing.T) {
	key := make([]byte, 32)
	encrypted, _ := EncryptPESEL("44051401359", key)

	wrongKey := make([]byte, 32)
	wrongKey[0] = 1

	got, err := DecryptPESEL(encrypted, wrongKey)
	if err == nil {
		t.Error("expected error for wrong key")
	}
	if got != maskedPESEL {
		t.Errorf("got = %q, want %q", got, maskedPESEL)
	}
}
