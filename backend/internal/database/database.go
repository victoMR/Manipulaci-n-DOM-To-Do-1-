// database/firestore.go
package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Client is the global Firestore client
var Client *firestore.Client

// InitFirestore initializes the Firestore client
func InitFirestore(ctx context.Context, projectID string, credsPath string) error {
    var err error

    // Initialize Firestore client with retry logic
    for attempts := 1; attempts <= 3; attempts++ {
        Client, err = firestore.NewClient(ctx, projectID, option.WithCredentialsFile(credsPath))
        if err == nil {
            break
        }

        log.Printf("Attempt %d: Failed to connect to Firestore: %v", attempts, err)
        if attempts < 3 {
            time.Sleep(time.Second * time.Duration(attempts))
        }
    }

    if err != nil {
        return fmt.Errorf("failed to initialize Firestore after 3 attempts: %v", err)
    }

    // Test connection
    if err := testConnection(ctx); err != nil {
        if status.Code(err) != codes.NotFound {
            Client.Close()
            return fmt.Errorf("connection test failed: %v", err)
        }
        // NotFound is acceptable as it means we can connect but collection doesn't exist
        log.Printf("Connection test returned NotFound - this is acceptable for new databases")
    }

    log.Println("Successfully connected to Firestore")
    return nil
}

// testConnection verifies the Firestore connection
func testConnection(ctx context.Context) error {
    _, err := Client.Collection("test").Doc("test").Get(ctx)
    if err != nil {
        if status.Code(err) == codes.NotFound {
            return nil // NotFound is acceptable
        }
        return err
    }
    return nil
}

// InitializeCollections ensures required collections exist
func InitializeCollections(ctx context.Context) error {
    collections := []string{"users", "tasks"}

    for _, colName := range collections {
        // Create a temporary document to initialize the collection
        tempDoc := Client.Collection(colName).Doc("_init")

        _, err := tempDoc.Set(ctx, map[string]interface{}{
            "initialized": true,
            "timestamp":   time.Now(),
        })
        if err != nil {
            return fmt.Errorf("failed to initialize collection %s: %v", colName, err)
        }

        // Clean up the temporary document
        _, err = tempDoc.Delete(ctx)
        if err != nil {
            log.Printf("Warning: Could not delete initialization document in %s: %v", colName, err)
        }
    }

    return nil
}

// Collections returns all collection references needed by the application
type Collections struct {
    Users *firestore.CollectionRef
    Tasks *firestore.CollectionRef
}

// GetCollections returns initialized collection references
func GetCollections() *Collections {
    return &Collections{
        Users: Client.Collection("users"),
        Tasks: Client.Collection("tasks"),
    }
}

// Close closes the Firestore client
func Close() error {
    if Client != nil {
        return Client.Close()
    }
    return nil
}
