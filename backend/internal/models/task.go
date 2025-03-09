package models

import (
	"time"
)

type Task struct {
	ID               string        `json:"id" firestore:"id"`
	UserID           string        `json:"user_id" firestore:"user_id"`                       // ID del usuario que creó la tarea
	GroupID          *string       `json:"group_id,omitempty" firestore:"group_id,omitempty"` // ID del grupo (puede ser nil)
	Title            string        `json:"title" firestore:"title"`
	Description      string        `json:"description" firestore:"description"`
	TimeUntilFinish  time.Duration `json:"time_until_finish" firestore:"time_until_finish"`
	RemindMe         bool          `json:"remind_me" firestore:"remind_me"`
	Status           string        `json:"status" firestore:"status"`
	Category         string        `json:"category" firestore:"category"`
	CreatedAt        time.Time     `json:"created_at" firestore:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at" firestore:"updated_at"`
	CreatedBy        string        `json:"created_by" firestore:"created_by"`                                   // ID del usuario que creó la tarea
	AssignedTo       *string       `json:"assigned_to,omitempty" firestore:"assigned_to,omitempty"`             // ID del usuario asignado (puede ser nil)
	ArrCollaborators []string      `json:"arr_collaborators,omitempty" firestore:"arr_collaborators,omitempty"` // IDs de colaboradores
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
	if t.Title == "" || t.Description == "" || t.CreatedBy == "" {
		return false
	}

	// Validate status
	switch t.Status {
	case TaskStatusPending, TaskStatusInProgress, TaskStatusCompleted:
		// Status is valid
	default:
		return false
	}

	// If the task is assigned to a group, it must have an assigned user
	if t.GroupID != nil && *t.GroupID != "" && t.AssignedTo == nil {
		return false
	}

	return true
}

// AddCollaborator adds a new collaborator to the task
func (t *Task) AddCollaborator(userID string) {
	for _, collaborator := range t.ArrCollaborators {
		if collaborator == userID {
			return // El colaborador ya está en la lista
		}
	}
	t.ArrCollaborators = append(t.ArrCollaborators, userID)
}

// RemoveCollaborator removes a collaborator from the task
func (t *Task) RemoveCollaborator(userID string) {
	for i, collaborator := range t.ArrCollaborators {
		if collaborator == userID {
			t.ArrCollaborators = append(t.ArrCollaborators[:i], t.ArrCollaborators[i+1:]...)
			return
		}
	}
}
