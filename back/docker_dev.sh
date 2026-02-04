docker run -d \
  --name rt-metagenomics \
  --rm \
  -p 3000:3000 \
  -p 8000:8000 \
  -v /:/ \
  rt-meta:latest