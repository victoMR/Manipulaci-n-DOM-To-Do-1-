package handlers

import (
	"log"
	"net/http"
	"task-manager-backend/internal/models"
	"task-manager-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type GroupHandler struct {
	groupService *services.GroupService
}

func NewGroupHandler() *GroupHandler {
	return &GroupHandler{
		groupService: services.NewGroupService(),
	}
}

// CreateGroupHandler maneja la creación de un grupo
func (h *GroupHandler) CreateGroupHandler(c *gin.Context) {
	var group models.Group
	if err := c.ShouldBindJSON(&group); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// Asignar el creador y inicializar campos
	group.CreatorID = userID.(string)
	// Inicializar el slice de miembros si es nil
	if group.Members == nil {
		group.Members = []string{}
	}
	// Agregar el creador como miembro
	group.Members = append(group.Members, userID.(string))

	if err := h.groupService.CreateGroup(&group); err != nil {
		log.Printf("Error creating group: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"group": group})
}

// GetGroupHandler obtiene un grupo por su ID
func (h *GroupHandler) GetGroupHandler(c *gin.Context) {
	groupID := c.Param("id")

	// Verificar que el usuario tiene acceso al grupo
	userID, _ := c.Get("user_id")

	group, err := h.groupService.GetGroupByID(groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Verificar si el usuario es miembro del grupo
	isMember := false
	for _, memberID := range group.Members {
		if memberID == userID.(string) {
			isMember = true
			break
		}
	}

	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this group"})
		return
	}

	// Obtener información detallada de los miembros
	membersList, err := h.groupService.GetGroupMembersDetails(group.Members)
	if err != nil {
		log.Printf("Error getting members details: %v", err)
		// No devolvemos error, solo continuamos con los IDs de los miembros
	}

	response := gin.H{"group": group}
	if membersList != nil {
		response["members"] = membersList
	}

	c.JSON(http.StatusOK, response)
}

// GetAllGroupsHandler obtiene todos los grupos del usuario
func (h *GroupHandler) GetAllGroupsHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	groups, err := h.groupService.GetUserGroups(userID.(string))
	if err != nil {
		log.Printf("Error getting user groups: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"groups": groups})
}

// AddMemberHandler agrega un miembro a un grupo
func (h *GroupHandler) AddMemberHandler(c *gin.Context) {
	groupID := c.Param("id")
	userID := c.Param("user_id")

	// Verificar que el usuario actual tiene permisos para añadir miembros
	currentUserID, _ := c.Get("user_id")

	group, err := h.groupService.GetGroupByID(groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Verificar si el usuario actual es el creador o un miembro del grupo
	isAuthorized := group.CreatorID == currentUserID.(string)
	if !isAuthorized {
		for _, memberID := range group.Members {
			if memberID == currentUserID.(string) {
				isAuthorized = true
				break
			}
		}
	}

	if !isAuthorized {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to add members to this group"})
		return
	}

	if err := h.groupService.AddMemberToGroup(groupID, userID); err != nil {
		log.Printf("Error adding member to group: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member added successfully"})
}

// RemoveMemberHandler elimina un miembro de un grupo
func (h *GroupHandler) RemoveMemberHandler(c *gin.Context) {
	groupID := c.Param("id")
	userID := c.Param("user_id")

	// Verificar que el usuario actual tiene permisos para eliminar miembros
	currentUserID, _ := c.Get("user_id")

	group, err := h.groupService.GetGroupByID(groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Verificar si el usuario actual es el creador o si se está eliminando a sí mismo
	isAuthorized := group.CreatorID == currentUserID.(string) || userID == currentUserID.(string)

	if !isAuthorized {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to remove this member from the group"})
		return
	}

	if err := h.groupService.RemoveMemberFromGroup(groupID, userID); err != nil {
		log.Printf("Error removing member from group: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
}
