FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main cmd/server/main.go

FROM golang:1.25-alpine
WORKDIR /app
RUN go install github.com/air-verse/air@latest
ENV PATH="/root/go/bin:${PATH}"
EXPOSE 8080
CMD ["air"]
