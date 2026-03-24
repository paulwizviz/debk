# Bilanx: Gemini Core Orchestrator

This file defines the high-level workflow and operational mandates.

## 1. Core Mandates

- **Language:** All documentation and comments must use British English. The only exception is coding name to follow US English.
- **Approval:** Ask for approval before you generate any output especially when you are seeking to modify any artefacts. DO NOT make up answer.

## 2. Context Registry

- **Project scope:** Refer to `./docs/concept.md`.
- **Data modelling:** When you are asked to create data model, you are to focus only logical data modelling. Do not focus SQL style modelling.
- **Code modelling:** When you are asked to generate code, follow Domain Driven Design (DDD) principles.

## 3. Output Standard

This project uses Go, SQL and Javascript/ReactJS as part of programming component.

For documentation Markdown is the main format.

In the case of an architectural modelling the principal language will be text based.

### Go

- Follow [Effective Go](https://go.dev/doc/effective_go) for idiomatic programming.
- Strict Go error handling; use `slog.Error` for logging.
- Error handling: Wrap errors with context using `%w`.
- Include `context.Context` for cancellation.
- Include a `doc.go` file and and Go doc in all packages with header like `//Package <package name> contains ...`
- Include a filename in all packages that has the same name of the package like `some.go` for `package some` to include all interfaces, constants, errors, etc., but create separate files for implementations.

Follow this layout for Go programming.

```sh
/cmd
/internal
```

Under `/cmd` folder, include main packages representing executable component.

Under `/internal` create shared packages for consumption by main packages in `/cmd`.

### SQL Statement

- **SQLite:** This is the principal database.
- **SQL conventions:** Use a dialect that is compatible for different types of SQL databases but focus only on SQLite.
- **DB migration:** We will use Goose for data migration.

### Web

Use only Javascript, ReactJS and Material-UI to create web pages.

- **ReactJS:** Follow this [https://github.com/pillarstudio/standards/blob/master/reactjs-guidelines.md](https://github.com/pillarstudio/standards/blob/master/reactjs-guidelines.md) when you generate ReactJS code
- **Material-UI:** Follow this [https://cursorrules.org/article/material-ui-cursor-mdc-file](https://cursorrules.org/article/material-ui-cursor-mdc-file) when you use material-ui.

## Markdown

Follow this convention when generating Markdown [https://spec.commonmark.org/0.31.2/](https://spec.commonmark.org/0.31.2/)

## Modelling Language

- **Data Modelling:** Use mermaid as the basis for modelling [https://mermaid.ai/open-source/syntax/entityRelationshipDiagram.html](https://mermaid.ai/open-source/syntax/entityRelationshipDiagram.html)
- **Sequence Diagram:** Use mermaid squence diagram technique [https://mermaid.ai/open-source/syntax/sequenceDiagram.html](https://mermaid.ai/open-source/syntax/sequenceDiagram.html)
- **Class Diagram:** Use this class diagram technique [https://mermaid.ai/open-source/syntax/classDiagram.html](https://mermaid.ai/open-source/syntax/classDiagram.html)

## 4. Transformation Workflow

You must execute tasks in the following sequence:

1. **Research:** Analyse this `/docs/concept.md` to understand the scope of this project.
2. **Strategy:** Propose a plan based on the relevant Context Registry file before you execute further action.
3. **Execution:**
   - **Phase 1:** Produce conceptual data models and persists documents in `/docs/models`.
   - **Phase 2:** Produce relevant Go, SQL and Web codes.
4. **Validation:** Ensure the output aligns with the project scope (do **NOT** stray from the project scope). Use British English mandates for all markdown documents under `/docs`. Use US English for codes (i.e. Go, SQL, Web). Always seek review before execution.
