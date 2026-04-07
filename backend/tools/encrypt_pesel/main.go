package main

import (
	"fmt"
	"os"

	"fleet-management/internal/crypto"
)

func main() {
	key := []byte(os.Getenv("ENCRYPTION_KEY"))
	if len(key) != 32 {
		fmt.Fprintln(os.Stderr, "ENCRYPTION_KEY must be 32 bytes (set in env)")
		os.Exit(1)
	}
	pesel := "44051401359"
	if len(os.Args) > 1 {
		pesel = os.Args[1]
	}
	enc, err := crypto.EncryptPESEL(pesel, key)
	if err != nil {
		panic(err)
	}
	fmt.Println(enc)
}
