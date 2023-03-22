# moneydashboard-report
A web app reporting the annual/monthly budget based on data on MoneyDashboard

# Live Demo
https://ileodo-moneydashboard-report-8iqnf.ondigitalocean.app/demo

# How to run

```sh
docker-composer up -d
```

It will take around 1-2 mins to build the typescript application, then you can check "http://localhost/demo"


# Docker Image maintain

Build and Push Image
```sh
docker buildx build --push --platform linux/amd64,linux/arm64 --tag ileodo/moneydashboard-report:latest .
```

