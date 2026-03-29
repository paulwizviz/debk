# Bilanx: Gemini Core Orchestrator

This file defines the high-level workflow and operational mandates.

## 1. Core Mandates

- **Language:** All documentation and comments must use British English. The only exception is coding name to follow US English.
- **Approval:** Ask for approval before you generate any output especially when you are seeking to modify any artefacts. DO NOT make up answer.

## 2. Project Layout

The project is layout is as follows:

```sh
/docs
/cmd
/internal
/web
```

All markdown documentation are assigned to this folder `/docs`.

These folders are assigned for Go codes:

```sh
/cmd
/internal
```

The folder `/web` is assigned for Javascripts and ReactJS.

## 3. Context Registry

### Project scope

Refer to `./docs/concept.md` to understand the scope of the project.

### Modelling

Use the following techniques to generate models:

- **DDD components:** Extract a list of terms in the domain and classify as **Bounded Context**, **Domain events**, **Entities**, and **Value objects**.
- **Semantic Data Modelling:** Focus on modelling the entity relationships associate with the business domain.
- **Use Case Analysis:** Identify personas and establish user stories associated with each persona. Also map out the sequence of information flow from UI to backend services.
- **Design Thinking:** Apply design thinking to use case analysis to generate webpages from the result of Use Case Analysis.

### Coding Standards

#### Go

- Follow [Effective Go](https://go.dev/doc/effective_go) for idiomatic programming.
- Error handling: Wrap errors with context using `%w`.
- Include `context.Context` for cancellation.
- Include a `doc.go` file and and Go doc in all packages with header like `//Package <package name> contains ...`
- Include a filename in all packages that has the same name of the package like `some.go` for `package some` to include all interfaces, constants, errors, etc., but create separate files for implementations.

Under `/cmd/debk` folder, include main packages representing executable component.

Under `/internal` create shared packages for consumption by main packages in `/cmd`.

#### SQL Statement

- **SQLite:** This is the principal database.
- **SQL conventions:** Use a dialect that is compatible for different types of SQL databases but focus only on SQLite.
- **DB migration:** We will use Goose for data migration.

## 4. Output Standard

This project uses Go, SQL and Javascript/ReactJS as part of programming component.

### Markdown Documentation

Use Markdown is the main format.

Follow this convention when generating Markdown [https://spec.commonmark.org/0.31.2/](https://spec.commonmark.org/0.31.2/)

### DDD, Data and Use Case Models

- **DDD components:** Create short single word names to associate with business terms. For example, if the domain uses the word "fintxn" as short from of term term "financial transaction". Also include definitions of terms used in the business so we can disambiguate with system term. For example, disambiguating account transactions from database transaction.
- **Logical data models:** Present data structure as logical data models only and avoid implementation specific aspects like primary and foreign keys or SQL data types.
- **User cases:** Presents a list personas of likely users of the application using human names and their profile. For each persona, include:
  - A persona interactions with application in the form use user stories: "Mary create a chart of account" with a list of acceptance critera.
  - Sequence diagram showing flow from User Interface to services.

Generate text base models based on these conventions:

- **Data Models:** Use mermaid as the basis for modelling [https://mermaid.ai/open-source/syntax/entityRelationshipDiagram.html](https://mermaid.ai/open-source/syntax/entityRelationshipDiagram.html)
- **Sequence Diagrams:** Use mermaid squence diagram technique [https://mermaid.ai/open-source/syntax/sequenceDiagram.html](https://mermaid.ai/open-source/syntax/sequenceDiagram.html)
- **Class Diagrams:** Use this class diagram technique [https://mermaid.ai/open-source/syntax/classDiagram.html](https://mermaid.ai/open-source/syntax/classDiagram.html)

### Web

Refer to the use cases in `/docs/model.md` to generate Web pages. Use only Javascript, ReactJS and Material-UI to create web pages.

- **ReactJS:** Follow this [https://github.com/pillarstudio/standards/blob/master/reactjs-guidelines.md](https://github.com/pillarstudio/standards/blob/master/reactjs-guidelines.md) when you generate ReactJS code
- **Material-UI:** Follow this [https://cursorrules.org/article/material-ui-cursor-mdc-file](https://cursorrules.org/article/material-ui-cursor-mdc-file) when you use material-ui.

## 5. Transformation Workflow

You must execute tasks in the following sequence:

1. **Research:** Analyse this `/docs/concept.md` to understand the scope of this project. **DO NOT** use `README.md` as basis for your analysis.
2. **Strategy:** Propose a plan based on the relevant Context Registry before you execute further action.
3. **Generate DDD, semantic data models and use case models:** When the strategy is approved, generate models and present the results in `/docs/model.md`.
4. **Validate models:** Ensure the output aligns with the project scope (do **NOT** stray from the project scope). Presents your observations and want for approval.
5. **Generate codes:** Upon approval of models generate appropriate Go, SQL and Web codes.
6. **Manual interventions:** There maybe instances where manual interventions may be required, and if any parts of documentations and codes have been augmented by manually inserted artefacts use that as a source of truth or pattern to follow.
