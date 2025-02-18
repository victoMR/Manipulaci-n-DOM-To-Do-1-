// internal/models/user.go
package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        string    `json:"id" firestore:"id"`
	Username  string    `json:"username" firestore:"username"`
	Email     string    `json:"email" firestore:"email"`
	Password  string    `json:"-" firestore:"password"`  // "-" omits from JSON responses
	CreatedAt time.Time `json:"created_at" firestore:"created_at"`
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
	if u.Username == "" || u.Email == "" || u.Password == "" {
		return false
	}

	// - Email format validation
	// - Username length and character restrictions
	// - Password complexity requirements

	return true
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
}
