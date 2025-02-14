package handlers

import (
	"log"
	"net/http"
	"os"
	"task-manager-backend/internal/database"
	"task-manager-backend/internal/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"github.com/golang-jwt/jwt/v4"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("Error parsing request:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar usuario
	var count int
	if err := database.Session.Query(`SELECT COUNT(*) FROM users WHERE username = ? ALLOW FILTERING`, req.Username).Scan(&count); err != nil {
		log.Println("Database error (SELECT):", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}

	// Crear usuario
	user := &models.User{
		ID:        gocql.TimeUUID(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  req.Password,
		CreatedAt: time.Now(),
	}

	if err := user.HashPassword(); err != nil {
		log.Println("Error hashing password:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error hashing password"})
		return
	}

	// Insertar en ScyllaDB
	if err := database.Session.Query(
		`INSERT INTO users (id, username, email, password, created_at) VALUES (?, ?, ?, ?, ?)`,
		user.ID, user.Username, user.Email, user.Password, user.CreatedAt,
	).Exec(); err != nil {
		log.Println("Database error (INSERT):", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
		return
	}

	log.Println("User registered successfully:", user.Username)
	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	var userID gocql.UUID
	var hashedPassword string

	if err := database.Session.Query(`SELECT id, password FROM users WHERE username = ? ALLOW FILTERING`,
		req.Username).Scan(&userID, &hashedPassword); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	user.ID = userID
	user.Password = hashedPassword

	if err := user.ComparePassword(req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generar JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.String(),
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

func GetUser(c *gin.Context) {
	// Obtener el user_id del contexto
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// Convertir userID a gocql.UUID
	userUUID, err := gocql.ParseUUID(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Buscar el usuario en la base de datos
	var user models.User
	if err := database.Session.Query(`SELECT id, username, email, created_at FROM users WHERE id = ?`,
		userUUID).Scan(&user.ID, &user.Username, &user.Email, &user.CreatedAt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching user"})
		return
	}

	// Devolver la información del usuario
	c.JSON(http.StatusOK, gin.H{"user": user})
}
