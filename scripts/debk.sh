#!/bin/bash

if [ "$(basename $(realpath .))" != "debk" ]; then
    echo "You are outside the scope of the project"
    exit 0
fi

export GO_VER=1.26.0
export APP_NAME=debk

export DEBK_BUILD_IMAGE=debk/debk-builder:current
export DEBK_BUILD_CONTAINER=debk-container

COMMAND=$1
SUBCOMMAND=$2

# Build web frontend before Go build
function build_web(){
    echo "Building web frontend..."
    (cd web && npm install && npm run build)
}

function build(){
    # Build web assets so they can be embedded in the Go binary
    build_web

    echo "Building Go application..."
    docker compose -f ./build/debk/builder.yaml build
    docker compose -f ./build/debk/builder.yaml up
    docker rm -f ${DEBK_BUILD_CONTAINER}
    
    # Fix: Changed DEBK_IMAGE to DEBK_BUILD_IMAGE
    if [ -n "$(docker images -q ${DEBK_BUILD_IMAGE})" ]; then
        docker rmi -f ${DEBK_BUILD_IMAGE}
    fi
    
    # Clean up dangling images silently
    DANGLING=$(docker images --filter "dangling=true" -q)
    if [ -n "$DANGLING" ]; then
        docker rmi -f $DANGLING
    fi
}

function clean(){
    echo "Cleaning build artifacts..."
    if [ -d ./package ]; then
        rm -rf ./package
    fi
    # Clean web build artifacts
    rm -rf ./internal/webserver/public/*
}

case $COMMAND in
    "build")
        build
        ;;
    "clean")
        clean
        ;;
    *)
        echo "Usage: $0 [ build | clean ]"
        ;;
esac