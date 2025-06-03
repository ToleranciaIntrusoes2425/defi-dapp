#!/bin/bash

echo "Starting Ganache with database path './blockchain'..."

if [ ! -d "blockchain" ]; then
  echo "'blockchain' directory not found. Creating it..."
  mkdir -p blockchain
fi

ganache --database.dbPath blockchain
