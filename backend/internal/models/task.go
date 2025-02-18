// internal/models/task.go
package models

import (
	"time"
)

type Task struct {
	ID              string        `json:"id" firestore:"id"`
	UserID          string        `json:"user_id" firestore:"user_id"`
	Title           string        `json:"title" firestore:"title"`
	Description     string        `json:"description" firestore:"description"`
	TimeUntilFinish time.Duration `json:"time_until_finish" firestore:"time_until_finish"`
	RemindMe        bool          `json:"remind_me" firestore:"remind_me"`
	Status          string        `json:"status" firestore:"status"`
	Category        string        `json:"category" firestore:"category"`
	CreatedAt       time.Time     `json:"created_at" firestore:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at" firestore:"updated_at"`
}

// Define valid status constants
const (
	TaskStatusPending    = "pending"
	TaskStatusInProgress = "in_progress"
	TaskStatusCompleted  = "completed"
)

// Validate checks if the task data is valid
func (t *Task) Validate() bool {
	// Check required fields
	if t.Title == "" || t.Description == "" {
		return false
	}

	// Validate status
	switch t.Status {
	case TaskStatusPending, TaskStatusInProgress, TaskStatusCompleted:
		return true
	default:
		return false
	}
}
