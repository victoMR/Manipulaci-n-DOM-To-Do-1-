package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// LoadEnv carga las variables de entorno desde un archivo .env
func LoadEnv() {
	// Cargar el archivo .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables directly.")
	}
}

// GetEnv devuelve el valor de una variable de entorno o un valor por defecto si no existe
func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
