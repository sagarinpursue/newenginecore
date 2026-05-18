# Naming Conventions

## CloudFormation (CLFT) Resources

1.  All resource names must start with a prefix: `f2-core-`, `f2-ai-`, `f2-cms-`, `f2-llm-`, `f2-cx-`; and end with the environment name.
2.  The names of resources like policies within a role or an authorizer (non-lambda) within API Gateway can be ignored for now, leaving them as 'SharedTokenAuthorizer', 'LambdaSecretsPolicy'. Suggestions for standardizing these names are welcome.
3.  Based on point 2 above:
    *   `LayerName`: `f2-core-common-layer-${Environment}`
    *   `LogGroupName`: `f2-cx-agents-tracing-logs-${Environment}`
    *   `BucketName` for the main bucket: `f2-core-${AWS::StackId}-${Environment}`
4.  `FunctionName`: `(prefix)-(grouping name part)-(optional clarifying name part)-(interaction method, e.g., get/post/put/delete/any/internal/script/authorizer)`. We will not rename repository folders for now, but we will follow this rule for new ones.
5.  `RoleName`: `(lambda/resource name)-role-(environment)`
6.  Do not use capital letters in names, only lowercase latin letters.

## Backend

1.  Name entities in routes in the singular:
    *   `GET /user/:user_id`
    *   `POST /user`
    *   `PUT /user/:user_id`
    *   `DELETE /user/:user_id`
2.  We get a list of entities using `POST /search`. If this is not applicable in some cases, we discuss it separately.
3.  Use only hyphens `-` in resource naming, do not use underscores `_`.

## Frontend

1.  Since we first land on a list, we will use the plural form, then upon opening details - the object's id and the name of the tab in the details:
    *   `/llm/structures/92532a5f-73bf-47bf-9609-5efb9528664c/details`
2.  Controller naming will correspond to the number of entities:
    *   `llm-structures`
    *   `llm-structure-details`
    *   `llm-structure-logs`
3.  Repeating the module name in the component name is not a problem: `/llm/llm-structure-details`.
4.  An additional level of grouping (`/llm/llm-structure/llm-structure-details`) is not needed "just in case". Grouping makes sense if there are already many folders, a conditional threshold of 20-25 items.

## Databases (Tables and Fields)

1.  Tables are named in the plural. Use lowercase latin letters and underscores `_` for naming.
2.  Grouping by modules/features is necessary. All tables related to a module start with its name: `llm_`, `cms_`, etc. Grouping within a module is also highly desirable, as there will be many tables (`cms_analysis_`, `chat_message_`, etc.).
3.  Tables related to the `core` module can be left without a module prefix.
4.  Tables for demos start with `demo_{name}_`.
5.  The idea of adding a `_ref` postfix was unsuccessful - we will not go down this path.
6.  Use lowercase latin letters and underscores `_` when naming columns as well.
7.  The unique identifier column should not be just `id`. The name of this column should include a reference to the entity: `chat_id`, `session_id`, etc.
8.  Each table must have `created_at`, `updated_at`, and `account_id` columns. Also, optionally `user_id`.
9.  When organizing cascading deletes, we must not delete historical data (for example, deleting a chat should not delete sessions).
10. Trigger names should follow the pattern: `(table name)-(function name)`.
11. Function names should follow the pattern for Lambda functions `(prefix)-(grouping name part)-(optional clarifying name part)-(optional interaction method)`, but with two modifications: the `f2-` prefix is omitted, and the `interaction-method` part is optional.
12. ENUM type names should follow the pattern `(prefix)-(grouping name part)-(optional clarifying name part)-type`. The `f2-` prefix should be omitted.
