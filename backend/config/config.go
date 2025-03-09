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
		// Only log as warning since this might be intentional in production
		fmt.Println("Warning: No .env file found, using environment variables")
	}

	config := &Config{}

	// Firebase configuration
	config.Firebase.CredentialsPath = getRequiredEnv("GOOGLE_APPLICATION_CREDENTIALS")
	config.Firebase.ProjectID = getRequiredEnv("PROJECT_ID")

	// Server configuration
	config.Server.Port = getEnvWithDefault("PORT", "8080")
	config.Server.Environment = getEnvWithDefault("GIN_MODE", "debug")

	// Handle CORS origins - allow all origins with "*"
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
