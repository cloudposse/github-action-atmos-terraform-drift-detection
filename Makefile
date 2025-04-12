SHELL := /bin/bash

# List of targets the `readme` target should call before generating the readme
export README_DEPS ?= docs/github-action.md

-include $(shell curl -sSL -o .build-harness "https://cloudposse.tools/build-harness"; echo .build-harness)

## Lint terraform code
lint:
	$(SELF) terraform/install terraform/get-modules terraform/get-plugins terraform/lint terraform/validate

## Build the project using vercel/ncc
build:
	@echo "Building the project..."
	@PATH="$(PATH):./node_modules/.bin" ncc build src/index.js -o dist
	@echo "Commit changes to dist/"
	@git add dist/ || true
	@git diff --cached --quiet dist/ || git commit -m "Update dist/ after build" || true
