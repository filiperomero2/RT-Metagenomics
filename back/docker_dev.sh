docker run -d \
  --name rt-metagenomics \
  --rm \
  -p 3000:3000 \
  -p 8000:8000 \
  -v /tmp/rtmeta/input:/app/rt-meta/input \
  -v /tmp/rtmeta/output:/app/rt-meta/output \
  -v /home/felippenacif/github/RT-Metagenomics/back/input/database/kraken2:/app/rt-meta/db/kraken2 \
  -v /home/felippenacif/github/RT-Metagenomics/back/input/database/krona/taxonomy:/app/rt-meta/db/krona/taxonomy \
  -e OUTPUT_DIR=/app/rt-meta/output \
  -e INPUT_DIR=/app/rt-meta/input \
  rt-meta:latest