// internal/models/user.go
package models

import (
	"regexp"
	"time"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        string    `json:"id" firestore:"id"`
	Username  string    `json:"username" firestore:"username"`
	Email     string    `json:"email" firestore:"email"`
	Password  string    `json:"-" firestore:"password"` // "-" omits from JSON responses
	CreatedAt time.Time `json:"created_at" firestore:"created_at"`
	Role      string    `json:"role" firestore:"role"`
}

// HashPassword encrypts the user's password using bcrypt
func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// ComparePassword checks if the provided password matches the hashed password
func (u *User) ComparePassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// Validate checks if the user data is valid
func (u *User) Validate() bool {
	// Check required fields
	if u.Username == "" || u.Email == "" || u.Password == "" || u.Role == "" {
		return false
	}

	// Email format validation
	if !isValidEmail(u.Email) {
		return false
	}

	// Username length and character restrictions
	if len(u.Username) < 3 || len(u.Username) > 20 {
		return false
	}
	if !isValidUsername(u.Username) {
		return false
	}

	// Password complexity requirements
	if !isValidPassword(u.Password) {
		return false
	}

	return true
}

// isValidEmail checks if the email has a valid format
func isValidEmail(email string) bool {
	// This is a simple regex for basic email validation
	// For production, consider using a more comprehensive regex or a library
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	return regexp.MustCompile(emailRegex).MatchString(email)
}

// isValidUsername checks if the username contains only allowed characters
func isValidUsername(username string) bool {
	// Allowed characters: letters, numbers, underscores, and hyphens
	usernameRegex := `^[a-zA-Z0-9_-]+$`
	return regexp.MustCompile(usernameRegex).MatchString(username)
}

// isValidPassword checks if the password meets complexity requirements
func isValidPassword(password string) bool {
	var (
		hasMinLen  = false
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	if len(password) >= 6 {
		hasMinLen = true
	}

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	return hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial
}

// ToMap converts the user to a map for Firestore storage
// Useful when you need to explicitly control what gets stored
func (u *User) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"id":         u.ID,
		"username":   u.Username,
		"email":      u.Email,
		"password":   u.Password,
		"created_at": u.CreatedAt,
		"role":       u.Role,
	}
}

// FromMap populates a user struct from a Firestore data map
func (u *User) FromMap(data map[string]interface{}) {
	if id, ok := data["id"].(string); ok {
		u.ID = id
	}
	if username, ok := data["username"].(string); ok {
		u.Username = username
	}
	if email, ok := data["email"].(string); ok {
		u.Email = email
	}
	if password, ok := data["password"].(string); ok {
		u.Password = password
	}
	if createdAt, ok := data["created_at"].(time.Time); ok {
		u.CreatedAt = createdAt
	}
	if role, ok := data["role"].(string); ok {
		u.Role = role
	}
}
