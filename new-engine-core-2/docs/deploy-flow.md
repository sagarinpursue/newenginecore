# Deploy Flow

## Product

When code is merged, the version should be increased. Build should be done separately for Core and every module. Structure: S3 bucket for specific region > f2-platform > x.y.z version folder > [core/cx] module folder. This structure is needed to allow installation for an account per module. On the same level as the `x.y.z` folder, there is a `latest` folder which is used for installation. 

Every environment will have its own CFT for installation in that particular environment (dev, at least temporarily, will not be reinstalled from a CFT). Production environment should have release/x.y.z branches for smoke testing purposes. After passing tests master branch will be updated together with latest folder.

Also, we should deliver the code to all supported regions (e.g., N. Virginia, Oregon, Ireland).

## Projects

Ideally, project branches should be created from master branch and installation should be done using production CFT. Project branches can have customizations (which should be confirmed by product team). Any new resource in the project scope should be created as a part of an SP module with its own nested stack. The SP module should be built separately with its own versioning: S3 bucket for specific region > sp folder > [client name] folder / x.y.z version folder. During installation instead of true/false flag, SP module will have input field, where should be provided sub-path like [client name]/x.y.z The SP module should be built on the `projects/xxx/dev` branch only; stage and prod branches will just use different versions.

> **Note:** The product has a CFT in every environment because the CFT (the installation process) is the exact end-product we are selling to clients. From the project side, the end-product is an already installed and stable platform. Product dev environment can have a lot of versions, stage less amount for QA procedures, and prod should have only stable ones.

## CI/CD

Planned common approach for CI/CD on every environment after push/merge is:
* linter and formatter check
* tests (initially just placeholder)
* check if version changed
* if not - stop
* if yes - build (deploy flow)
* wait for manual approval to deploy

CI/CD for projects TBD. CI/CD should be implemented as a separate CFT, ideally a single one for all regions.