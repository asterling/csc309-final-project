#!/bin/bash

# This script manages the start and stop of the backend and frontend servers.

# Get the absolute path of the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

BACKEND_PID_FILE="$SCRIPT_DIR/backend.pid"
FRONTEND_PID_FILE="$SCRIPT_DIR/frontend.pid"

start() {
    if [ -f "$BACKEND_PID_FILE" ] || [ -f "$FRONTEND_PID_FILE" ]; then
        echo "Error: Servers may already be running. PID files found."
        echo "If servers are not running, please remove backend.pid and frontend.pid files and try again."
        exit 1
    fi

    echo "Starting backend server..."
    cd "$SCRIPT_DIR/backend"
    node index.js 8080 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$BACKEND_PID_FILE"
    echo "Backend server started with PID $BACKEND_PID."
    cd "$SCRIPT_DIR"

    echo "Starting frontend server..."
    cd "$SCRIPT_DIR/frontend"
    # Redirect npm start output to a log file to prevent it from cluttering the console
    npm start > "$SCRIPT_DIR/frontend-start.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    echo "Frontend server started with PID $FRONTEND_PID. Output is in frontend-start.log."
    cd "$SCRIPT_DIR"

    echo "Servers started successfully."
}

stop() {
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        # Use kill -9 for a more forceful stop if a simple kill doesn't work
        kill $BACKEND_PID
        rm "$BACKEND_PID_FILE"
        echo "Backend server stopped."
    else
        echo "Backend server does not appear to be running (no PID file)."
    fi

    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        echo "Stopping frontend server and its children (Parent PID: $FRONTEND_PID)..."
        # Use pkill -P to kill all child processes of the npm start script
        pkill -P $FRONTEND_PID
        # Kill the parent npm start process itself
        kill $FRONTEND_PID
        rm "$FRONTEND_PID_FILE"
        echo "Frontend server stopped."
    else
        echo "Frontend server does not appear to be running (no PID file)."
    fi
}

restart() {
    echo "Restarting servers..."
    stop
    start
    echo "Servers restarted."
}

reseed() {
    echo "Reseeding database and restarting servers..."
    stop
    echo "Running seed script..."
    cd "$SCRIPT_DIR/backend"
    npm run seed
    cd "$SCRIPT_DIR"
    start
    echo "Database reseeded and servers restarted."
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    reseed)
        reseed
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|reseed}"
        exit 1
esac

exit 0
