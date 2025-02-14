// internal/models/user.go
package models

import (
	"time"

	"github.com/gocql/gocql"
)

type Task struct {
	ID          gocql.UUID `json:"id"`
	UserID      gocql.UUID `json:"user_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
