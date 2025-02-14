// internal/models/user.go
package models

import (
	"time"

	"github.com/gocql/gocql"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        gocql.UUID `json:"id"`
	Username  string     `json:"username"`
	Email     string     `json:"email"`
	Password  string     `json:"-"`
	CreatedAt time.Time  `json:"created_at"`
}

func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

func (u *User) ComparePassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}
