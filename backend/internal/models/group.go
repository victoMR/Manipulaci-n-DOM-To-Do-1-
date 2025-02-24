package models

import (
	"time"
)

type Group struct {
	ID          string    `json:"id" firestore:"id"`
	CreatorID   string    `json:"creator_id" firestore:"creator_id"`
	Name        string    `json:"name" firestore:"name"`
	Description string    `json:"description" firestore:"description"`
	Members     []string  `json:"members" firestore:"members"`
	CreatedAt   time.Time `json:"created_at" firestore:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" firestore:"updated_at"`
}

// Validate verifica si los datos del grupo son válidos
func (g *Group) Validate() bool {
	if g.CreatorID == "" || g.Name == "" || len(g.Members) == 0 {
		return false
	}
	if len(g.Name) > 100 || len(g.Description) > 500 {
		return false
	}
	return true
}

// AddMember agrega un nuevo miembro al grupo
func (g *Group) AddMember(userID string) {
	for _, member := range g.Members {
		if member == userID {
			return // El usuario ya es miembro del grupo
		}
	}
	g.Members = append(g.Members, userID)
}

// RemoveMember elimina un miembro del grupo
func (g *Group) RemoveMember(userID string) {
	for i, member := range g.Members {
		if member == userID {
			g.Members = append(g.Members[:i], g.Members[i+1:]...)
			return
		}
	}
}
