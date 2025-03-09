// config/config.go
package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Firebase struct {
		CredentialsPath string
		ProjectID       string
	}
	Server struct {
		Port           string
		AllowedOrigins []string
		Environment    string
	}
}

func LoadConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		fmt.Println("Warning: No .env file found, using environment variables")
	}

	config := &Config{}

	// Firebase configuration
	config.Firebase.ProjectID = getRequiredEnv("PROJECT_ID")

	// Leer el JSON de Firebase desde la variable de entorno
	firebaseCreds := getRequiredEnv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
	tempFile, err := os.CreateTemp("", "firebase-creds-*.json")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %v", err)
	}
	defer tempFile.Close()

	if _, err := tempFile.WriteString(firebaseCreds); err != nil {
		return nil, fmt.Errorf("failed to write credentials to temp file: %v", err)
	}

	config.Firebase.CredentialsPath = tempFile.Name()

	// Server configuration
	config.Server.Port = getEnvWithDefault("PORT", "8080")
	config.Server.Environment = getEnvWithDefault("GIN_MODE", "debug")
	config.Server.AllowedOrigins = []string{"*"}

	return config, nil
}

func getRequiredEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic(fmt.Sprintf("Required environment variable %s is not set", key))
	}
	return value
}

func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
