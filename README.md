# Status

Untested, Don't Use.

# How to Use

In `.gitlab-ci.yml`, probably in a `deploy` stage, install this package and run
a deploy script:

```
deploy:
  stage: deploy
  image: node:6
  only:
    - deploy-branch@some-name/my-project
  script:
    - npm install gitlab2rancher-deploy
    - node scripts/deploy.js
```

... where `scripts/deploy.js` may look like this:

```
const upgrade = require('gitlab2rancher-deploy')

const serviceUrl = process.env.RANCHER_SERVICE_URL

upgrade(serviceUrl)
.catch(err => { console.log(err.stack); process.exit(1) })
```

... and after defining the service url as a Gitlab variabl, e.g.

```
RANCHER_SERVICE_URL=https://my-rancher.my-host.com/v1/projects/1a5/services/1s29
```

... and `RANCHER_ACCESS_KEY` and `RANCHER_SECRET_KEY` (under `API` in Rancher):

At the next push to branch `deploy-branch` of project `some-name/my-project`,
the Rancher service with id `1s29` should be upgraded accordingly.
