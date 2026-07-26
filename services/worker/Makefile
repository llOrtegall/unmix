SCHEMA := ../../packages/contracts/generated/json-schema/separation.v1.json
GENERATED := src/unmix_worker/contracts/generated.py

.PHONY: contracts lint test check run

# Regenerate pydantic models from the shared JSON Schema (ADR 0016).
contracts:
	uv run datamodel-codegen --input $(SCHEMA) --input-file-type jsonschema \
		--output $(GENERATED) --output-model-type pydantic_v2.BaseModel \
		--use-title-as-name --use-standard-collections --use-union-operator \
		--target-python-version 3.12 --disable-timestamp --enum-field-as-literal all

lint:
	uv run ruff check src tests scripts
	uv run mypy
	uv run lint-imports

test:
	uv run pytest -q

check: lint test

run:
	uv run python -m unmix_worker.main
