ARG GO_VER=1.25.1

FROM golang:${GO_VER}

WORKDIR /opt

COPY ./go.mod ./go.mod
COPY ./go.sum ./go.sum
COPY ./cmd ./cmd
COPY ./internal ./internal

RUN go mod download
