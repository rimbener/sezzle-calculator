## Objective

Build a full-stack calculator application with a React frontend and a backend microservice. The frontend should consume the backend API to perform basic and advanced arithmetic operations. Focus on clean design, maintainable code, and testable architecture.

## Requirements

### Functional

Operations:

- Addition, Subtraction, Multiplication, Division
- Exponentiation, Square Root, Percentage

### Frontend (SPA):

Intuitive UI for entering input and displaying results

- Input validation and error handling
- Responsive design (basic mobile support)

### Backend (REST API):

- Expose endpoints for calculator operations
- Validate input and handle edge cases (division by zero, invalid data)
- Return results in JSON format

### Non-Functional

- Clean, readable, and idiomatic code (frontend and backend)
- Unit tests covering key functionality for both layers

### Constraints

- Frontend: React: Vite + TypeScript + Vanilla CSS
- Backend: TypeScript: Hono + Zod
