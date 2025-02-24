package handlers

import (
	"context"
	"log"
	"net/http"
	"os"
	"task-manager-backend/internal/database"
	"task-manager-backend/internal/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("Error parsing request:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()
	usersRef := database.Client.Collection("users")

	// Check if username already exists
	docs, err := usersRef.Where("username", "==", req.Username).Documents(ctx).GetAll()
	if err != nil {
		log.Println("Database error (query):", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if len(docs) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Println("Error hashing password:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error hashing password"})
		return
	}

	// Create user
	user := models.User{
		ID:        uuid.New().String(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Role:      req.Role,
		CreatedAt: time.Now(),
	}

	// Save to Firestore
	_, err = usersRef.Doc(user.ID).Set(ctx, map[string]interface{}{
		"id":         user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"password":   user.Password,
		"role":       user.Role,
		"created_at": user.CreatedAt,
	})

	if err != nil {
		log.Println("Database error (set):", err)
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

	ctx := context.Background()
	usersRef := database.Client.Collection("users")

	// Find user by username
	docs, err := usersRef.Where("username", "==", req.Username).Documents(ctx).GetAll()
	if err != nil {
		log.Println("Database error (query):", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if len(docs) == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	userData := docs[0].Data()

	// Compare passwords
	if err := bcrypt.CompareHashAndPassword(
		[]byte(userData["password"].(string)),
		[]byte(req.Password),
	); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userData["id"].(string),
		"exp":     time.Now().Add(time.Minute * 10).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
		return
	}

	// Devuelve el token, username y role
	c.JSON(http.StatusOK, gin.H{
		"token":    tokenString,
		"username": userData["username"].(string),
		"role":     userData["role"].(string),
	})
}

func GetUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	ctx := context.Background()
	doc, err := database.Client.Collection("users").Doc(userID.(string)).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching user"})
		return
	}

	userData := doc.Data()
	user := models.User{
		ID:        userData["id"].(string),
		Username:  userData["username"].(string),
		Email:     userData["email"].(string),
		Role:      userData["role"].(string),
		CreatedAt: userData["created_at"].(time.Time),
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// SearchUser busca usuarios por correo electrónico
func SearchUser(c *gin.Context) {
	email := c.Query("email") // Obtener el correo electrónico de la query string
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	ctx := context.Background()
	usersRef := database.Client.Collection("users")

	// Buscar usuarios por correo electrónico
	docs, err := usersRef.Where("email", "==", email).Documents(ctx).GetAll()
	if err != nil {
		log.Println("Database error (query):", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error searching user"})
		return
	}

	if len(docs) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No users found"})
		return
	}

	// Mapear los resultados a un slice de usuarios
	var users []models.User
	for _, doc := range docs {
		userData := doc.Data()

		// Verificar si el campo "role" existe y no está vacío
		role, ok := userData["role"].(string)
		if !ok || role == "" {
			role = "user" // Valor por defecto si el campo no existe o está vacío
		}

		user := models.User{
			ID:        userData["id"].(string),
			Username:  userData["username"].(string),
			Email:     userData["email"].(string),
			Role:      role, // Usar el valor verificado
			CreatedAt: userData["created_at"].(time.Time),
		}
		users = append(users, user)
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}
