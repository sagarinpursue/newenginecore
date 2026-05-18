# Branching Strategy

1. Logically, branches can be split into product branches and project branches.
2. Product branches are `dev`, `stage`, `prod`, `feature/{ticket_id}`, and `bug/{ticket_id}`.
3. Merges from `feature/{ticket_id}` and `bug/{ticket_id}` branches to `dev`, from `dev` to `stage`, and from `stage` to `prod` require a PR creation.
4. Project branches follow the same structure, but those branches have the `projects/{client_name}` prefix, like `projects/{client_name}/dev` or `projects/{client_name}/feature/{ticket_id}`.
5. The `projects/{client_name}/stage` branch is optional and can be skipped based on client requirements.
6. Project branches should contain only minimal required customizations, which need to be approved by the Product Team.
