FROM golang:1.25-alpine
WORKDIR /app
RUN go install github.com/air-verse/air@v1.64.5 && \
    go install -tags "mysql" github.com/golang-migrate/migrate/v4/cmd/migrate@v4.19.1
ENV PATH="/go/bin:${PATH}"
EXPOSE 8080
CMD ["air"]
