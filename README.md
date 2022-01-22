# Test Challenges

## Integration Tests

A docker container is necessary for the integration tests:

```bash
docker run --name ignite-test-challenges \
    -e POSTGRES_PASSWORD=docker \
    -e POSTGRES_DB=fin_api \
    -p 5432:5432 \
    -d \
    postgres
```
