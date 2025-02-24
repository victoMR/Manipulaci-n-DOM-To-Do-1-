package services

import (
	"context"
	"errors"
	"log"
	"task-manager-backend/internal/database"
	"task-manager-backend/internal/models"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	"google.golang.org/api/iterator"
)

// GroupService proporciona métodos para gestionar grupos
type GroupService struct{}

// NewGroupService crea una nueva instancia de GroupService
func NewGroupService() *GroupService {
	return &GroupService{}
}

// CreateGroup crea un nuevo grupo
func (s *GroupService) CreateGroup(group *models.Group) error {
	ctx := context.Background()

	// Generar ID único si no existe
	if group.ID == "" {
		group.ID = uuid.New().String()
	}

	// Establecer timestamp de creación
	group.CreatedAt = time.Now()

	// Guardar el grupo en Firestore
	_, err := database.Client.Collection("groups").Doc(group.ID).Set(ctx, group)
	if err != nil {
		log.Printf("Error creating group in Firestore: %v", err)
		return err
	}

	return nil
}

// GetGroupByID obtiene un grupo por su ID
func (s *GroupService) GetGroupByID(groupID string) (*models.Group, error) {
	ctx := context.Background()

	doc, err := database.Client.Collection("groups").Doc(groupID).Get(ctx)
	if err != nil {
		log.Printf("Error getting group from Firestore: %v", err)
		return nil, err
	}

	var group models.Group
	if err := doc.DataTo(&group); err != nil {
		log.Printf("Error converting Firestore document to Group: %v", err)
		return nil, err
	}

	return &group, nil
}

// GetUserGroups obtiene todos los grupos a los que pertenece un usuario
func (s *GroupService) GetUserGroups(userID string) ([]models.Group, error) {
	ctx := context.Background()

	// Buscar grupos donde el usuario es miembro
	iter := database.Client.Collection("groups").Where("members", "array-contains", userID).Documents(ctx)

	var groups []models.Group
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Error iterating groups: %v", err)
			return nil, err
		}

		var group models.Group
		if err := doc.DataTo(&group); err != nil {
			log.Printf("Error converting document to Group: %v", err)
			continue
		}

		groups = append(groups, group)
	}

	return groups, nil
}

// GetGroupMembersDetails obtiene información detallada de los miembros de un grupo
func (s *GroupService) GetGroupMembersDetails(memberIDs []string) ([]models.User, error) {
	if len(memberIDs) == 0 {
		return []models.User{}, nil
	}

	ctx := context.Background()
	var members []models.User

	// Obtener detalles de cada miembro
	for _, memberID := range memberIDs {
		doc, err := database.Client.Collection("users").Doc(memberID).Get(ctx)
		if err != nil {
			log.Printf("Error getting user %s: %v", memberID, err)
			continue
		}

		userData := doc.Data()

		// Verificar si el campo "role" existe y no está vacío
		role, ok := userData["role"].(string)
		if !ok || role == "" {
			role = "user" // Valor por defecto
		}

		user := models.User{
			ID:       userData["id"].(string),
			Username: userData["username"].(string),
			Email:    userData["email"].(string),
			Role:     role,
		}

		members = append(members, user)
	}

	return members, nil
}

// AddMemberToGroup agrega un miembro a un grupo
func (s *GroupService) AddMemberToGroup(groupID, userID string) error {
	ctx := context.Background()

	// Verificar si el grupo existe
	group, err := s.GetGroupByID(groupID)
	if err != nil {
		return err
	}

	// Verificar si el usuario existe
	userDoc, err := database.Client.Collection("users").Doc(userID).Get(ctx)
	if err != nil {
		return errors.New("user not found")
	}

	// Verificar si el usuario ya es miembro
	for _, memberID := range group.Members {
		if memberID == userID {
			return errors.New("user is already a member of this group")
		}
	}

	// Agregar el usuario a los miembros del grupo
	_, err = database.Client.Collection("groups").Doc(groupID).Update(ctx, []firestore.Update{
		{
			Path:  "members",
			Value: append(group.Members, userID),
		},
	})

	if err != nil {
		log.Printf("Error updating group members: %v", err)
		return err
	}

	// También agregar el grupo al usuario si se mantiene esta relación en el modelo de usuario
	userData := userDoc.Data()
	userGroups, ok := userData["groups"].([]string)
	if !ok {
		userGroups = []string{}
	}

	// Verificar si el grupo ya está en la lista del usuario
	groupExists := false
	for _, gID := range userGroups {
		if gID == groupID {
			groupExists = true
			break
		}
	}

	if !groupExists {
		_, err = database.Client.Collection("users").Doc(userID).Update(ctx, []firestore.Update{
			{
				Path:  "groups",
				Value: append(userGroups, groupID),
			},
		})

		if err != nil {
			log.Printf("Error updating user groups: %v", err)
			// No devolvemos error aquí para no revertir la adición al grupo
		}
	}

	return nil
}

// RemoveMemberFromGroup elimina un miembro de un grupo
func (s *GroupService) RemoveMemberFromGroup(groupID, userID string) error {
	ctx := context.Background()

	// Verificar si el grupo existe
	group, err := s.GetGroupByID(groupID)
	if err != nil {
		return err
	}

	// El creador no puede ser eliminado del grupo
	if group.CreatorID == userID {
		return errors.New("creator cannot be removed from the group")
	}

	// Crear nueva lista sin el miembro
	var newMembers []string
	memberFound := false

	for _, memberID := range group.Members {
		if memberID != userID {
			newMembers = append(newMembers, memberID)
		} else {
			memberFound = true
		}
	}

	if !memberFound {
		return errors.New("user is not a member of this group")
	}

	// Actualizar los miembros del grupo
	_, err = database.Client.Collection("groups").Doc(groupID).Update(ctx, []firestore.Update{
		{
			Path:  "members",
			Value: newMembers,
		},
	})

	if err != nil {
		log.Printf("Error updating group members: %v", err)
		return err
	}

	// También eliminar el grupo de la lista del usuario si se mantiene esta relación
	userDoc, err := database.Client.Collection("users").Doc(userID).Get(ctx)
	if err == nil {
		userData := userDoc.Data()
		userGroups, ok := userData["groups"].([]string)
		if ok {
			var newUserGroups []string
			for _, gID := range userGroups {
				if gID != groupID {
					newUserGroups = append(newUserGroups, gID)
				}
			}

			_, err = database.Client.Collection("users").Doc(userID).Update(ctx, []firestore.Update{
				{
					Path:  "groups",
					Value: newUserGroups,
				},
			})

			if err != nil {
				log.Printf("Error updating user groups: %v", err)
				// No devolvemos error aquí para no revertir la eliminación del grupo
			}
		}
	}

	return nil
}
